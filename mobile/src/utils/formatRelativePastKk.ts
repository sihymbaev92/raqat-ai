/**
 * ISO уақытынан қазірге дейінгі аралықты қазақша қысқа мәтінге (UI кэш белгісі).
 */
export function formatRelativePastKk(iso: string, now: Date = new Date()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const diffMs = Math.max(0, now.getTime() - t);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "жаңа ғана";
  if (minutes < 60) return `${minutes} мин бұрын`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} сағ бұрын`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days} күн бұрын`;
  return new Date(t).toLocaleDateString("kk-KZ", { day: "numeric", month: "short", year: "numeric" });
}
