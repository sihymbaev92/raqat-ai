/** Тақырып карточкасының жабық күйіндегі бір жолдық қысқаша мәтін */
export function traditionTopicTeaser(summary: string, maxLen = 96): string {
  const trimmed = summary.trim();
  if (!trimmed) return "";
  const dot = trimmed.search(/[.!?]\s/);
  const first = (dot > 0 ? trimmed.slice(0, dot + 1) : trimmed).trim();
  if (first.length <= maxLen) {
    return first.length < trimmed.length ? `${first}…` : first;
  }
  return `${first.slice(0, maxLen - 1).trim()}…`;
}
