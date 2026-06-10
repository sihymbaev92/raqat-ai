/**
 * Басты беттегі «келесі намаз» прогресс жолағы — күн ішіндегі уақыт сегменттері.
 */
export function parseMinutes(timeStr: string): number {
  const clean = timeStr.trim().split(/\s+/)[0] ?? "";
  const p = clean.split(":");
  if (p.length < 2) return 0;
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}

/** Кестедегі келесі парыз намаздың кілті (күн шығу есептелмейді) — UI ерекшелеу үшін */
export function nextSalatHighlightKey(rows: { key: string; time: string }[]): string | null {
  const salat = rows.filter((r) => r.key !== "sun" && r.time?.trim());
  if (!salat.length) return null;
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  for (const r of salat) {
    if (parseMinutes(r.time) > nowM) return r.key;
  }
  return salat[0]?.key ?? null;
}

/**
 * Бүгінгі кестеден кейінгі парыз намаз жолы.
 * Бүгінгі барлық намаз өткен болса, `tomorrowRows` болса сондағы бірінші парызды (әдетте таң) қайтарады.
 */
export function nextSalatRow<T extends { key: string; time: string }>(
  rows: T[],
  tomorrowRows: T[] | null | undefined,
  now: Date = new Date()
): T | null {
  const salat = rows.filter((r) => r.key !== "sun" && r.time?.trim());
  if (!salat.length) return null;
  const nowM = now.getHours() * 60 + now.getMinutes();
  for (const r of salat) {
    if (parseMinutes(r.time) > nowM) return r;
  }
  if (tomorrowRows?.length) {
    const tSalat = tomorrowRows.filter((r) => r.key !== "sun" && r.time?.trim());
    return tSalat[0] ?? salat[0] ?? null;
  }
  return salat[0] ?? null;
}

/** Кестені келесі намаздан бастап көрсету (өткен уақыттар төменге). */
export function orderRowsFromNextSalat<T extends { key: string; time: string }>(
  rows: T[],
  tomorrowRows: T[] | null | undefined,
  now: Date = new Date()
): T[] {
  if (rows.length < 2) return rows;
  const next = nextSalatRow(rows, tomorrowRows, now);
  if (!next) return rows;
  const idx = rows.findIndex((r) => r.key === next.key);
  if (idx <= 0) return rows;
  return [...rows.slice(idx), ...rows.slice(0, idx)];
}

/**
 * UI: келесі намаз жолағының астындағы тізім (күн шығусыз, келесі намаз қайталанбайды).
 * Бүгінгі кесте өткен болса — ертеңгі кесте.
 */
export function displayPrayerRowsFromNext<T extends { key: string; time: string }>(
  rows: T[],
  tomorrowRows: T[] | null | undefined,
  now: Date = new Date()
): T[] {
  const salat = rows.filter((r) => r.key !== "sun" && r.time?.trim());
  const nowM = now.getHours() * 60 + now.getMinutes();
  const allPast = salat.length > 0 && salat.every((r) => parseMinutes(r.time) <= nowM);
  const useTomorrow = allPast && Boolean(tomorrowRows?.length);

  const source = useTomorrow ? tomorrowRows! : rows;
  const ordered = orderRowsFromNextSalat(source, useTomorrow ? null : tomorrowRows, now);
  const next = nextSalatRow(rows, tomorrowRows, now);
  if (!next) return ordered.filter((r) => r.key !== "sun" && r.time?.trim());

  const nextIdx = ordered.findIndex((r) => r.key === next.key);
  if (nextIdx < 0) {
    return ordered.filter((r) => {
      if (r.key === "sun" || r.key === next.key) return false;
      return Boolean(r.time?.trim());
    });
  }

  return ordered.slice(nextIdx + 1).filter((r) => r.key !== "sun" && r.time?.trim());
}

/** 0..1 — қазіргі сәт алдыңғы намаз уақытынан келесіне дейінгі аралықта қай жерде */
export function progressBetweenScheduledPrayers(times: string[], now: Date): number {
  if (times.length < 2) return 0;
  const t = times.map(parseMinutes).sort((a, b) => a - b);
  const n = t.length;
  const nowM = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < n; i++) {
    const start = t[i];
    const end = i + 1 < n ? t[i + 1] : t[0] + 24 * 60;
    if (i < n - 1) {
      if (nowM >= start && nowM < end) {
        return (nowM - start) / (end - start);
      }
    } else {
      if (nowM >= start) {
        return (nowM - start) / (end - start);
      }
    }
  }

  if (nowM < t[0]) {
    const start = t[n - 1];
    const end = t[0] + 24 * 60;
    return (nowM + 24 * 60 - start) / (end - start);
  }
  return 0;
}

/** Келесі парыз намазға дейінгі минут (күн шығу кірмейді) */
export function minutesUntilNextSalat(
  rows: { key: string; time: string }[],
  now: Date,
  tomorrowRows?: { key: string; time: string }[] | null
): number {
  const salat = rows.filter((r) => r.key !== "sun");
  if (!salat.length) return 0;
  const nowM = now.getHours() * 60 + now.getMinutes();
  for (const r of salat) {
    const m = parseMinutes(r.time);
    if (m > nowM) return m - nowM;
  }
  if (tomorrowRows?.length) {
    const tSalat = tomorrowRows.filter((r) => r.key !== "sun" && r.time?.trim());
    const first = tSalat[0];
    if (first) {
      const mT = parseMinutes(first.time);
      return mT + 24 * 60 - nowM;
    }
  }
  return parseMinutes(salat[0].time) + 24 * 60 - nowM;
}

/**
 * Келесі парыз намаз уақытына дейінгі секунд (жергілікті күн; `nextSalatRow` логикасымен үйлесімді).
 */
export function secondsUntilNextSalat(
  rows: { key: string; time: string }[],
  now: Date,
  tomorrowRows?: { key: string; time: string }[] | null
): number {
  const next = nextSalatRow(rows, tomorrowRows, now);
  if (!next?.time?.trim()) return 0;
  const clean = next.time.trim().split(/\s+/)[0] ?? "";
  const pm = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!pm) return 0;
  const h = parseInt(pm[1]!, 10);
  const mi = parseInt(pm[2]!, 10);
  const y = now.getFullYear();
  const mo = now.getMonth();
  const d = now.getDate();
  let target = new Date(y, mo, d, h, mi, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target = new Date(y, mo, d + 1, h, mi, 0, 0);
  }
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

/** `secondsUntilNextSalat` → `HH:MM:SS` (99 сағатқа дейін). */
export function formatSecondsAsHms(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
