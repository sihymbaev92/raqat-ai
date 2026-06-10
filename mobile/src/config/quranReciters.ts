/**
 * Аят сайын дыбыс: cdn.islamic.network/quran/audio/{128|192}/{edition}/{1..6236}.mp3
 * (Al Quran Cloud edition slug). Кейбір сұралған қарилар жеке source арқылы қосылады
 * (`quranSudaisAudio.ts`).
 */
export type QuranReciterGroup = "kk" | "ru" | "ar";

export type QuranReciterOption = {
  edition: string;
  labelKk: string;
  group: QuranReciterGroup;
};

export const DEFAULT_QURAN_RECITER_EDITION = "ar.abdurrahmaansudais";

/** Абдурахман Моссадтың ашық Archive.org-та бар таңдаулы толық сүрелері. */
export const QURAN_ABDULRAHMAN_MOSSAD_EDITION = "archive.abdulrahman-mossad-selected";

/** Қазақша аят аудиосы (аударма оқылуы, CDN 128 kbps). */
export const QURAN_KK_HALIFAH_ALTAI_EDITION = "kk.khalifahaltai-audio";

/** Орысша аят аудиосы — Эльмир Кулиев аудармасы (CDN 128 kbps). */
export const QURAN_RU_KULIEV_EDITION = "ru.kuliev-audio";

/** Қари тізімі: islamic.network edition slug. */
export const QURAN_RECITER_OPTIONS: QuranReciterOption[] = [
  {
    edition: QURAN_KK_HALIFAH_ALTAI_EDITION,
    labelKk: "Халифа Алтай — қазақша аудио (аударма оқылуы)",
    group: "kk",
  },
  {
    edition: QURAN_RU_KULIEV_EDITION,
    labelKk: "Эльмир Кулиев — орысша оқылу (аударма)",
    group: "ru",
  },
  { edition: "ar.abdurrahmaansudais", labelKk: "Әбдіррахман Ас-Судәис", group: "ar" },
  { edition: "ar.abdulbasitmurattal", labelKk: "Қари Әбділбасит (мұратаал)", group: "ar" },
  { edition: "ar.husary", labelKk: "Махмуд Хали Әл-Һусари", group: "ar" },
  { edition: "ar.mahermuaiqly", labelKk: "Маһир Әл-Муайқлий", group: "ar" },
  { edition: QURAN_ABDULRAHMAN_MOSSAD_EDITION, labelKk: "Абдурахман Моссад — таңдаулы сүрелер", group: "ar" },
];

export const QURAN_RECITER_GROUP_ORDER: QuranReciterGroup[] = ["kk", "ru", "ar"];

export function normalizeReciterEdition(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return DEFAULT_QURAN_RECITER_EDITION;
  return QURAN_RECITER_OPTIONS.some((o) => o.edition === s) ? s : DEFAULT_QURAN_RECITER_EDITION;
}
