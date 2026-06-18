import { parseMinutes } from "./prayerSchedule";

const DEFAULT_MAX_LATE_MS = 8_000;
const DEFAULT_ACTIVE_BEFORE_MS = 5_000;

export function shouldFireInAppPrayerMoment(
  now: Date,
  timeStr: string,
  activeSinceMs: number,
  opts?: { maxLateMs?: number; activeBeforeMs?: number }
): boolean {
  if (!timeStr?.trim()) return false;
  const targetMinutes = parseMinutes(timeStr);
  if (targetMinutes < 0) return false;

  const target = new Date(now);
  target.setHours(Math.floor(targetMinutes / 60), targetMinutes % 60, 0, 0);
  const targetMs = target.getTime();
  const delta = now.getTime() - targetMs;
  const maxLateMs = opts?.maxLateMs ?? DEFAULT_MAX_LATE_MS;
  const activeBeforeMs = opts?.activeBeforeMs ?? DEFAULT_ACTIVE_BEFORE_MS;

  return delta >= 0 && delta <= maxLateMs && activeSinceMs <= targetMs - activeBeforeMs;
}
