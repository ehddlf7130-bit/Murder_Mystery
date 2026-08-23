/** 조건부 className 결합 (clsx 의존성 없이 필요한 만큼만) */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(' ');
}
