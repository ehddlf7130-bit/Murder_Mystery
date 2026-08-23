const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/** 마지막 글자에 받침이 있는지 (한글 음절이 아니면 null) */
function hasFinalConsonant(word: string): boolean | null {
  const last = word.trim().at(-1);
  if (!last) return null;
  const code = last.codePointAt(0)!;
  if (code < HANGUL_START || code > HANGUL_END) return null;
  return (code - HANGUL_START) % 28 !== 0;
}

/**
 * 조사를 받침에 맞게 붙인다. "투약 기록부을(를)" 같은 표기를 피하기 위한 것.
 * 한글이 아닌 이름(영문·숫자)에는 앞쪽 형태를 쓴다.
 */
export function withParticle(
  word: string,
  withFinal: '을' | '이' | '은' | '과' | '으로',
  withoutFinal: '를' | '가' | '는' | '와' | '로',
): string {
  const final = hasFinalConsonant(word);
  return `${word}${final === false ? withoutFinal : withFinal}`;
}

/** 목적격 조사: 을/를 */
export function objectParticle(word: string): string {
  return withParticle(word, '을', '를');
}
