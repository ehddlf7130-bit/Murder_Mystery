import { describe, expect, it } from 'vitest';
import { objectParticle, withParticle } from './korean';

describe('objectParticle', () => {
  it('받침이 있으면 을', () => {
    expect(objectParticle('시신')).toBe('시신을');
    expect(objectParticle('방명록')).toBe('방명록을');
    expect(objectParticle('약병')).toBe('약병을');
    expect(objectParticle('샴페인 잔')).toBe('샴페인 잔을');
  });

  it('받침이 없으면 를', () => {
    expect(objectParticle('투약 기록부')).toBe('투약 기록부를');
    expect(objectParticle('금고')).toBe('금고를');
    expect(objectParticle('동선 대조표')).toBe('동선 대조표를');
  });

  it('한글이 아닌 끝 글자는 받침 있는 형태로 처리한다', () => {
    expect(objectParticle('CCTV')).toBe('CCTV을');
  });
});

describe('withParticle', () => {
  it('주격·보조사도 같은 규칙으로 붙는다', () => {
    expect(withParticle('약병', '이', '가')).toBe('약병이');
    expect(withParticle('금고', '이', '가')).toBe('금고가');
    expect(withParticle('시신', '은', '는')).toBe('시신은');
    expect(withParticle('대조표', '은', '는')).toBe('대조표는');
  });
});
