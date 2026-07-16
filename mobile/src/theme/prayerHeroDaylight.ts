import { parseMinutes } from "../utils/prayerSchedule";

export type PrayerDaylightPhase =
  | "night"
  | "dawn"
  | "sunrise"
  | "day"
  | "golden"
  | "sunset";

export type PrayerDaylightTimes = {
  fajr?: string;
  sunrise?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
};

/**
 * Тек аспан жолағына арналған градиент (төменгі мешіт/Қағба тиіспейді).
 * Соңғы түс әрқашан мөлдір — архитектураға түспейді.
 */
export type PrayerDaylightLook = {
  phase: PrayerDaylightPhase;
  colors: [string, string, string, string];
  locations: [number, number, number, number];
  /** Аспан жолағының биіктігі (контейнер үлесі, 0–1) */
  skyBandHeight: number;
};

function mins(time: string | undefined): number {
  if (!time?.trim()) return -1;
  return parseMinutes(time.trim().split(/\s+/)[0] ?? time);
}

function hasAnyPrayerAnchor(times: PrayerDaylightTimes): boolean {
  return [times.fajr, times.sunrise, times.dhuhr, times.asr, times.maghrib, times.isha].some(
    (t) => mins(t) >= 0
  );
}

/** Намаз кестесі жоқ/жүктелмегенде — жүйелік сағат бойынша шамамен күн/түн. */
export function prayerDaylightPhaseFromClock(nowM: number): PrayerDaylightPhase {
  if (nowM >= 330 && nowM < 420) return "dawn";
  if (nowM >= 420 && nowM < 660) return "sunrise";
  if (nowM >= 660 && nowM < 960) return "day";
  if (nowM >= 960 && nowM < 1080) return "golden";
  if (nowM >= 1080 && nowM < 1260) return "sunset";
  return "night";
}

/**
 * Намаз кестесіне қарай тәулік фазасы:
 * таң ату → күн шығу → күндіз → алтын сағат → бату → түн.
 * Бір уақыт жоқ болса — көрші шекаралармен жалғастырылады; әйтпесе сағат fallback.
 */
export function prayerDaylightPhaseFor(
  times: PrayerDaylightTimes,
  now: Date = new Date()
): PrayerDaylightPhase {
  const nowM = now.getHours() * 60 + now.getMinutes();
  if (!hasAnyPrayerAnchor(times)) {
    return prayerDaylightPhaseFromClock(nowM);
  }

  const fajr = mins(times.fajr);
  const sunrise = mins(times.sunrise);
  const dhuhr = mins(times.dhuhr);
  const asr = mins(times.asr);
  const maghrib = mins(times.maghrib);
  const isha = mins(times.isha);

  if (fajr >= 0 && sunrise >= 0 && nowM >= fajr && nowM < sunrise) return "dawn";

  const morningEnd = dhuhr >= 0 ? dhuhr : asr >= 0 ? asr : 720;
  if (sunrise >= 0 && nowM >= sunrise && nowM < morningEnd) return "sunrise";

  const dayEnd = asr >= 0 ? asr : maghrib >= 0 ? maghrib : morningEnd + 180;
  if (dhuhr >= 0 && nowM >= dhuhr && nowM < dayEnd) return "day";

  const goldenEnd = maghrib >= 0 ? maghrib : asr >= 0 ? asr + 150 : dayEnd + 120;
  if (asr >= 0 && nowM >= asr && nowM < goldenEnd) return "golden";

  const sunsetEnd = isha >= 0 ? isha : maghrib >= 0 ? maghrib + 90 : goldenEnd + 90;
  if (maghrib >= 0 && nowM >= maghrib && nowM < sunsetEnd) return "sunset";

  if (isha >= 0 && fajr >= 0 && (nowM >= isha || nowM < fajr)) return "night";
  if (isha >= 0 && nowM >= isha) return "night";
  if (fajr >= 0 && nowM < fajr) return "night";

  return prayerDaylightPhaseFromClock(nowM);
}

const CLEAR = "rgba(0,0,0,0)";

function softenRgbaAlpha(color: string, factor: number): string {
  const m = color.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  if (!m) return color;
  const alpha = Math.min(1, Math.max(0, Number(m[4]) * factor));
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha.toFixed(3)})`;
}

/** Жарық суреттердің үстінде градиентті жұмсарту. */
export function softenPrayerDaylightLook(
  look: PrayerDaylightLook,
  factor: number
): PrayerDaylightLook {
  return {
    ...look,
    colors: look.colors.map((c) => (c === CLEAR ? c : softenRgbaAlpha(c, factor))) as [
      string,
      string,
      string,
      string,
    ],
    skyBandHeight: look.skyBandHeight * (0.55 + factor * 0.35),
  };
}

export function prayerDaylightLookFor(
  times: PrayerDaylightTimes,
  now: Date = new Date()
): PrayerDaylightLook {
  const phase = prayerDaylightPhaseFor(times, now);
  return prayerDaylightLookForPhase(phase);
}

/** Hero аспаны — намаз кестесіне байланған кең жолақ (таң → күн → кеш → түн). */
export function prayerHeroSkyLookFor(
  times: PrayerDaylightTimes,
  now: Date = new Date()
): PrayerDaylightLook {
  const phase = prayerDaylightPhaseFor(times, now);
  return prayerHeroSkyLookForPhase(phase);
}

/** @deprecated prayerHeroSkyLookFor қолданыңыз */
export function prayerHeroEveningSkyLookFor(
  times: PrayerDaylightTimes,
  now: Date = new Date()
): PrayerDaylightLook {
  return prayerHeroSkyLookFor(times, now);
}

function prayerDaylightLookForPhase(phase: PrayerDaylightPhase): PrayerDaylightLook {
  switch (phase) {
    case "dawn":
      return {
        phase,
        colors: ["rgba(90, 70, 140, 0.55)", "rgba(255, 160, 140, 0.38)", "rgba(120, 150, 200, 0.16)", CLEAR],
        locations: [0, 0.35, 0.7, 1],
        skyBandHeight: 0.46,
      };
    case "sunrise":
      return {
        phase,
        colors: ["rgba(255, 230, 160, 0.62)", "rgba(255, 210, 120, 0.38)", "rgba(200, 230, 255, 0.18)", CLEAR],
        locations: [0, 0.4, 0.72, 1],
        skyBandHeight: 0.48,
      };
    case "day":
      return {
        phase,
        colors: ["rgba(100, 180, 255, 0.82)", "rgba(170, 220, 255, 0.52)", "rgba(235, 245, 255, 0.22)", CLEAR],
        locations: [0, 0.38, 0.76, 1],
        skyBandHeight: 0.5,
      };
    case "golden":
      return {
        phase,
        colors: ["rgba(255, 190, 100, 0.42)", "rgba(255, 150, 70, 0.22)", "rgba(255, 210, 150, 0.1)", CLEAR],
        locations: [0, 0.38, 0.72, 1],
        skyBandHeight: 0.44,
      };
    case "sunset":
      return {
        phase,
        colors: ["rgba(255, 100, 50, 0.45)", "rgba(200, 50, 90, 0.26)", "rgba(80, 30, 60, 0.12)", CLEAR],
        locations: [0, 0.4, 0.75, 1],
        skyBandHeight: 0.46,
      };
    case "night":
    default:
      return {
        phase,
        colors: ["rgba(2, 8, 28, 0.28)", "rgba(4, 12, 36, 0.12)", CLEAR, CLEAR],
        locations: [0, 0.45, 0.8, 1],
        skyBandHeight: 0.42,
      };
  }
}

function prayerHeroSkyLookForPhase(phase: PrayerDaylightPhase): PrayerDaylightLook {
  switch (phase) {
    case "dawn":
      return {
        phase,
        colors: [
          "rgba(70, 55, 120, 0.62)",
          "rgba(255, 140, 150, 0.44)",
          "rgba(160, 130, 200, 0.18)",
          CLEAR,
        ],
        locations: [0, 0.32, 0.68, 1],
        skyBandHeight: 0.56,
      };
    case "sunrise":
      return {
        phase,
        colors: [
          "rgba(255, 210, 120, 0.68)",
          "rgba(255, 180, 90, 0.42)",
          "rgba(180, 220, 255, 0.2)",
          CLEAR,
        ],
        locations: [0, 0.34, 0.7, 1],
        skyBandHeight: 0.58,
      };
    case "day":
      return {
        phase,
        colors: [
          "rgba(70, 160, 255, 0.62)",
          "rgba(150, 210, 255, 0.38)",
          "rgba(220, 240, 255, 0.14)",
          CLEAR,
        ],
        locations: [0, 0.36, 0.72, 1],
        skyBandHeight: 0.55,
      };
    case "golden":
      return {
        phase,
        colors: [
          "rgba(255, 165, 70, 0.66)",
          "rgba(255, 130, 60, 0.4)",
          "rgba(200, 100, 80, 0.16)",
          CLEAR,
        ],
        locations: [0, 0.32, 0.68, 1],
        skyBandHeight: 0.58,
      };
    case "sunset":
      return {
        phase,
        colors: [
          "rgba(255, 85, 40, 0.74)",
          "rgba(210, 50, 90, 0.48)",
          "rgba(75, 35, 90, 0.22)",
          CLEAR,
        ],
        locations: [0, 0.3, 0.66, 1],
        skyBandHeight: 0.62,
      };
    case "night":
    default:
      return {
        phase,
        colors: [
          "rgba(12, 18, 65, 0.58)",
          "rgba(45, 32, 85, 0.34)",
          "rgba(80, 50, 100, 0.12)",
          CLEAR,
        ],
        locations: [0, 0.36, 0.72, 1],
        skyBandHeight: 0.56,
      };
  }
}

export function prayerDaylightTimesFromRows(
  rows: readonly { key: string; time: string }[]
): PrayerDaylightTimes {
  const pick = (key: string) => {
    const raw = rows.find((r) => r.key === key)?.time?.trim();
    return raw || undefined;
  };
  return {
    fajr: pick("fajr"),
    sunrise: pick("sun") ?? pick("sunrise"),
    dhuhr: pick("dhuhr"),
    asr: pick("asr"),
    maghrib: pick("maghrib"),
    isha: pick("isha"),
  };
}
