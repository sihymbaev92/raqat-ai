/**
 * Басты беттегі «келесі намаз» прогресс жолағы — күн ішіндегі уақыт сегменттері.
 */
export function parseMinutes(timeStr: string): number {
  const clean = timeStr.trim().split(/\s+/)[0] ?? "";
  const p = clean.split(":");
  if (p.length < 2) return 0;
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
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
  now: Date
): number {
  const salat = rows.filter((r) => r.key !== "sun");
  if (!salat.length) return 0;
  const nowM = now.getHours() * 60 + now.getMinutes();
  for (const r of salat) {
    const m = parseMinutes(r.time);
    if (m > nowM) return m - nowM;
  }
  return parseMinutes(salat[0].time) + 24 * 60 - nowM;
}
