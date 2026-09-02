/**
 * 원고(content/<id>.md)와 코드(src/data/<id>/*.ts)의 동기화 검사.
 *
 * 두 곳이 같은 내용을 이중으로 들고 있어 양방향으로 드리프트한다.
 * 필드마다 어느 쪽이 정본인지 정해져 있으므로, 차이를 **방향과 함께** 출력한다.
 *
 *   원고 정본 — 캐릭터의 `#### 배경` 본문
 *   코드 정본 — 그 외 전부
 *
 * `npm test`에는 넣지 않는다. 집필 중 불일치는 정상이라 테스트를 깨뜨리면 안 된다.
 *
 *   npm run check:content            전체 시나리오
 *   npm run check:content -- cruise  하나만
 */
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');

/** 원고가 정본인 필드 (그 외는 전부 코드가 정본) */
const MD_WINS = new Set(['배경']);

// ─────────────────────────────────────────── 코드 데이터

/**
 * 실제 모듈을 로드해 진짜 Scenario 객체를 얻는다.
 * 정규식으로 TS를 파싱하면 파서가 데이터와 따로 놀기 때문에 쓰지 않는다.
 * 앱 설정(configFile)은 로드하지 않는다 — 플러그인이 필요 없고, `@` alias만 있으면 된다.
 */
async function loadScenarios() {
  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true },
    resolve: { alias: { '@': path.join(ROOT, 'src') } },
  });
  try {
    const mod = await server.ssrLoadModule('/src/data/index.ts');
    return mod.listScenarios().map((s) => mod.getScenario(s.id));
  } finally {
    await server.close();
  }
}

// ─────────────────────────────────────────── 원고 파싱

const EMOJI = /\p{Extended_Pictographic}(️)?$/u;

/** 헤딩 끝의 이모지를 이름에서 떼어낸다 */
function splitEmoji(text) {
  const parts = text.trim().split(/\s+/);
  const last = parts.at(-1) ?? '';
  if (parts.length > 1 && EMOJI.test(last)) {
    return { name: parts.slice(0, -1).join(' '), emoji: last };
  }
  return { name: text.trim(), emoji: undefined };
}

/**
 * 여러 줄 본문을 문단 배열로 만든다.
 * 문서화된 규칙: 빈 줄 = 문단 구분, 소프트 줄바꿈 = 공백.
 */
function paragraphs(lines) {
  const out = [];
  let cur = [];
  for (const line of lines) {
    if (line.trim() === '') {
      if (cur.length) out.push(cur.join(' '));
      cur = [];
    } else {
      cur.push(line.trim());
    }
  }
  if (cur.length) out.push(cur.join(' '));
  return out;
}

const prose = (lines) => paragraphs(lines).join('\n\n');

/** `- 필드: 값` 목록. 들여쓴 다음 줄은 이어 붙는다 */
function fields(lines) {
  const map = new Map();
  let key = null;
  for (const line of lines) {
    const m = /^-\s+([^:]+):\s*(.*)$/.exec(line);
    if (m) {
      key = m[1].trim();
      map.set(key, m[2].trim());
    } else if (key && /^\s+\S/.test(line)) {
      map.set(key, `${map.get(key)} ${line.trim()}`);
    } else if (line.trim() === '') {
      key = null;
    }
  }
  return map;
}

/** `- 항목` 목록 (필드가 아닌 순수 불릿) */
const bullets = (lines) =>
  lines.map((l) => /^-\s+(.*)$/.exec(l.trim())?.[1]).filter((v) => v != null);

/** 헤딩 깊이로 트리를 만든다 */
function sections(lines, depth) {
  const head = new RegExp(`^#{${depth}} (?!#)(.*)$`);
  const out = [];
  let cur = null;
  for (const line of lines) {
    const m = head.exec(line);
    if (m) {
      cur = { title: m[1].trim(), lines: [] };
      out.push(cur);
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  return out;
}

/** 하위 헤딩이 나오기 전까지의 앞부분 */
const preamble = (lines, depth) => {
  const i = lines.findIndex((l) => new RegExp(`^#{1,${depth}} `).test(l));
  return i === -1 ? lines : lines.slice(0, i);
};

function parseManuscript(text) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n');

  const top = new Map(sections(lines, 2).map((s) => [s.title, s.lines]));
  const info = top.get('기본 정보') ?? [];
  const infoFields = fields(preamble(info, 3));
  const infoSub = new Map(sections(info, 3).map((s) => [s.title, s.lines]));

  const decks = [];
  const areas = [];
  for (const deck of sections(top.get('구역') ?? [], 3)) {
    const dm = /^(\d+)층\s*·\s*(.*)$/.exec(deck.title);
    const note = preamble(deck.lines, 4)
      .map((l) => /^>\s*(.*)$/.exec(l.trim())?.[1])
      .find((v) => v != null);
    if (dm) decks.push({ level: Number(dm[1]), name: dm[2].trim(), note });
    for (const area of sections(deck.lines, 4)) {
      const { name, emoji } = splitEmoji(area.title);
      areas.push({ name, emoji, description: prose(area.lines), deck: dm?.[2].trim() });
    }
  }

  const characters = sections(top.get('캐릭터') ?? [], 3).map((c) => {
    const [head, job] = c.title.split('—');
    const { name: jobName, emoji } = splitEmoji(job ?? '');
    const f = fields(preamble(c.lines, 4));
    const sub = new Map(sections(c.lines, 4).map((s) => [s.title, s.lines]));
    return {
      name: head.trim(),
      job: jobName,
      emoji,
      isCulprit: f.get('범인') === '예',
      publicProfile: f.get('공개 프로필') ?? '',
      backstory: prose(sub.get('배경') ?? []),
      goals: bullets(sub.get('개인 목표') ?? []),
      secrets: bullets(sub.get('비밀') ?? []),
    };
  });

  const clues = sections(top.get('단서') ?? [], 3).map((c) => {
    const f = fields(preamble(c.lines, 4));
    const sub = new Map(sections(c.lines, 4).map((s) => [s.title, s.lines]));
    const requires = f.get('해제조건') ?? '없음';
    return {
      name: c.title,
      location: f.get('위치') ?? '',
      requires: requires === '없음' ? [] : requires.split(',').map((s) => s.trim()),
      cost: f.has('비용') ? Number(f.get('비용')) : undefined,
      hint: f.get('힌트'),
      hintCost: f.has('힌트 비용') ? Number(f.get('힌트 비용')) : undefined,
      lockedLabel: f.get('잠김이름'),
      lockedTeaser: f.get('잠김힌트'),
      hidden: f.get('숨김') === '예',
      body: prose(sub.get('본문') ?? []),
    };
  });

  return {
    title: infoFields.get('제목'),
    tagline: infoFields.get('한 줄 소개'),
    playerCount: infoFields.get('인원'),
    playtime: infoFields.get('플레이타임'),
    totalInvestigations: Number(infoFields.get('총 열람 횟수')),
    totalHints: Number(infoFields.get('총 힌트 횟수')),
    synopsis: prose(infoSub.get('도입부') ?? []),
    epilogue: prose(infoSub.get('에필로그') ?? []),
    decks,
    areas,
    characters,
    clues,
  };
}

// ─────────────────────────────────────────── 비교

class Diff {
  constructor() {
    this.toCode = []; // 원고가 정본 → 코드를 고쳐야 한다
    this.toMd = []; // 코드가 정본 → 원고를 고쳐야 한다
    this.counts = new Map();
  }

  ok(kind) {
    this.counts.set(kind, (this.counts.get(kind) ?? 0) + 1);
  }

  cmp(where, field, mdValue, codeValue) {
    const md = normalize(mdValue);
    const code = normalize(codeValue);
    if (md === code) return true;
    const entry = { where, field, md, code };
    (MD_WINS.has(field) ? this.toCode : this.toMd).push(entry);
    return false;
  }
}

const normalize = (v) => {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.map(normalize).join(' | ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v).replace(/\s+/g, ' ').trim();
};

/**
 * 구역을 화면에 나오는 순서로 편다 — 높은 층부터, 층 안에서는 `order` 오름차순.
 * `areas` 배열 자체의 순서는 화면에 영향이 없으므로 (src/lib/decks.ts가 다시 정렬한다)
 * 원고의 층별 배치와 맞춰 보려면 이 순서를 써야 한다.
 */
function displayOrder(code) {
  const level = new Map((code.decks ?? []).map((d) => [d.id, d.level]));
  return [...code.areas].sort((a, b) => {
    const la = level.get(a.deckId) ?? -Infinity;
    const lb = level.get(b.deckId) ?? -Infinity;
    return lb - la || a.order - b.order;
  });
}

function compare(md, code) {
  const d = new Diff();

  for (const [field, a, b] of [
    ['제목', md.title, code.title],
    ['한 줄 소개', md.tagline, code.tagline],
    ['인원', md.playerCount, code.playerCount],
    ['플레이타임', md.playtime, code.playtime],
    ['총 열람 횟수', md.totalInvestigations, code.totalInvestigations],
    ['총 힌트 횟수', md.totalHints, code.totalHints],
    ['도입부', md.synopsis, code.synopsis],
    ['에필로그', md.epilogue, code.epilogue],
  ]) {
    if (d.cmp('기본 정보', field, a, b)) d.ok('기본 정보');
  }

  // 층 — 원고에는 id가 없으므로 순서로 대응시킨다
  const codeDecks = code.decks ?? [];
  compareList(d, '층', md.decks, codeDecks, (x) => x.name, (dd, w, m, c) => {
    dd.cmp(w, '층수', m.level, c.level);
    dd.cmp(w, '접근 안내', m.note, c.note);
  });

  const areaName = new Map(code.areas.map((a) => [a.id, a.name]));
  const deckName = new Map(codeDecks.map((x) => [x.id, x.name]));
  compareList(d, '구역', md.areas, displayOrder(code), (x) => x.name, (dd, w, m, c) => {
    dd.cmp(w, '이모지', m.emoji, c.emoji);
    dd.cmp(w, '묘사', m.description, c.description);
    dd.cmp(w, '층', m.deck, deckName.get(c.deckId));
  });

  const charName = new Map(code.characters.map((c) => [c.id, c.name]));
  compareList(d, '캐릭터', md.characters, code.characters, (x) => x.name, (dd, w, m, c) => {
    dd.cmp(w, '직업', m.job, c.job);
    dd.cmp(w, '이모지', m.emoji, c.emoji);
    dd.cmp(w, '범인', m.isCulprit, c.isCulprit);
    dd.cmp(w, '공개 프로필', m.publicProfile, c.publicProfile);
    dd.cmp(w, '배경', m.backstory, c.backstory);
    dd.cmp(w, '개인 목표', m.goals, c.goals.map((g) => g.text));
    dd.cmp(w, '비밀', m.secrets, c.secrets ?? []);
  });

  const clueName = new Map(code.clues.map((c) => [c.id, c.name]));
  compareList(d, '단서', md.clues, code.clues, (x) => x.name, (dd, w, m, c) => {
    const loc =
      c.location.kind === 'area'
        ? areaName.get(c.location.areaId)
        : `소지품 / ${charName.get(c.location.characterId)}`;
    dd.cmp(w, '위치', m.location, loc);
    dd.cmp(w, '해제조건', m.requires, c.requires.map((id) => clueName.get(id) ?? id));
    dd.cmp(w, '비용', m.cost, c.cost);
    dd.cmp(w, '힌트', m.hint, c.hint);
    dd.cmp(w, '힌트 비용', m.hintCost, c.hintCost);
    dd.cmp(w, '잠김이름', m.lockedLabel, c.special?.lockedLabel);
    dd.cmp(w, '잠김힌트', m.lockedTeaser, c.special?.lockedTeaser);
    dd.cmp(w, '숨김', m.hidden, c.hiddenUntilUnlocked ?? false);
    dd.cmp(w, '본문', m.body, c.body);
  });

  return d;
}

/** 이름으로 짝을 맞추고, 누락·추가·순서 차이를 먼저 잡는다 */
function compareList(d, kind, mdList, codeList, key, compareOne) {
  const mdKeys = mdList.map(key);
  const codeKeys = codeList.map(key);
  const mdSet = new Set(mdKeys);
  const codeSet = new Set(codeKeys);

  for (const k of codeKeys) {
    if (!mdSet.has(k)) d.toMd.push({ where: kind, field: '누락', md: '(없음)', code: k });
  }
  for (const k of mdKeys) {
    if (!codeSet.has(k)) d.toMd.push({ where: kind, field: '원고에만 있음', md: k, code: '(없음)' });
  }

  // 양쪽에 다 있는 것만 남겨 순서를 비교한다.
  // 어긋난 항목만 짚어 준다 — 전체 목록을 늘어놓으면 무엇을 옮겨야 할지 알 수 없다.
  const mdCommon = mdKeys.filter((k) => codeSet.has(k));
  const codeCommon = codeKeys.filter((k) => mdSet.has(k));
  for (let i = 0; i < codeCommon.length; i++) {
    if (mdCommon[i] === codeCommon[i]) continue;
    const name = codeCommon[i];
    const from = mdCommon.indexOf(name);
    d.toMd.push({
      where: `${kind} · ${name}`,
      field: '순서',
      md: `${from + 1}번째 (${mdCommon[from - 1] ?? '맨 앞'} 다음)`,
      code: `${i + 1}번째 (${codeCommon[i - 1] ?? '맨 앞'} 다음)`,
    });
    break;
  }

  const byKey = new Map(mdList.map((m) => [key(m), m]));
  for (const c of codeList) {
    const m = byKey.get(key(c));
    if (!m) continue;
    const before = d.toMd.length + d.toCode.length;
    compareOne(d, `${kind} · ${key(c)}`, m, c);
    if (d.toMd.length + d.toCode.length === before) d.ok(kind);
  }
}

// ─────────────────────────────────────────── 출력

/**
 * 배경 서사처럼 긴 값은 앞부분만 잘라 보여주면 양쪽이 똑같아 보인다.
 * 처음으로 갈리는 지점을 찾아 그 주변만 잘라낸다.
 */
function around(a, b, n = 100) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const start = Math.max(0, i - Math.floor(n / 4));
  const cut = (s) =>
    (start > 0 ? '…' : '') + s.slice(start, start + n) + (start + n < s.length ? '…' : '');
  return [cut(a), cut(b)];
}

function printGroup(title, entries) {
  if (!entries.length) return;
  console.log(`\n  ${title}`);
  for (const e of entries) {
    const [md, code] = around(e.md, e.code);
    console.log(`     ${e.where} · ${e.field}`);
    console.log(`       원고: ${md}`);
    console.log(`       코드: ${code}`);
  }
}

function report(id, d) {
  const total = d.toCode.length + d.toMd.length;
  console.log(`\n[1m[${id}][0m`);

  printGroup('📝 원고 → 코드  (원고가 정본이므로 코드를 고친다)', d.toCode);
  printGroup('💻 코드 → 원고  (코드가 정본이므로 원고를 고친다)', d.toMd);

  const ok = [...d.counts].map(([k, n]) => `${k} ${n}`).join(' · ');
  console.log(total === 0 ? `\n  ✅ 일치: ${ok}` : `\n  ⚠️  차이 ${total}건 (일치: ${ok})`);
  return total;
}

// ─────────────────────────────────────────── main

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const scenarios = await loadScenarios();
let failures = 0;

for (const code of scenarios) {
  if (only.length && !only.includes(code.id)) continue;
  const file = path.join(ROOT, 'content', `${code.id}.md`);
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    console.log(`\n[${code.id}] 원고 없음 — ${path.relative(ROOT, file)} (건너뜀)`);
    continue;
  }
  failures += report(code.id, compare(parseManuscript(text), code));
}

console.log('');
process.exit(failures > 0 ? 1 : 0);
