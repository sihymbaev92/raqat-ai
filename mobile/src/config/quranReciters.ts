/**
 * Аят сайын дыбыс: cdn.islamic.network/quran/audio/{128|192}/{edition}/{1..6236}.mp3
 * (Al Quran Cloud edition slug). ky/uz — RAQAT CDN (`quranTranslationAudioBase.ts`).
 * Кейбір араб қарилар жеке source арқылы қосылады (`quranSudaisAudio.ts`).
 */
import type { AppLocale } from "../i18n/runtime";

export type QuranReciterGroup = "kk" | "ru" | "en" | "ky" | "uz" | "tr" | "ar";

export type QuranReciterKind = "translation" | "arabic";

export type QuranReciterOption = {
  edition: string;
  labelKk: string;
  group: QuranReciterGroup;
  kind: QuranReciterKind;
  /** CDN / Quran.com арқылы аят сайын MP3 бар ма. */
  audioAvailable: boolean;
};

export const DEFAULT_QURAN_RECITER_EDITION = "ar.abdurrahmaansudais";

/** Бұрынғы сақталған preference-ті Mahmud Al-Husary-ға көшіру үшін ғана сақталады. */
export const QURAN_ABDULRAHMAN_MOSSAD_EDITION = "archive.abdulrahman-mossad-selected";
export const QURAN_HUSARY_EDITION = "ar.husary";
/** Maher Al-Muaiqly — CDN араб қарисы (karaoke timed binding жоқ). */
export const QURAN_MAHER_MUAIQLY_EDITION = "ar.mahermuaiqly";
export const QURAN_ALAFASY_EDITION = "ar.alafasy";

/** Қазақстан — Халифа Алтай (аударма оқылуы, CDN 128 kbps). */
export const QURAN_KK_HALIFAH_ALTAI_EDITION = "kk.khalifahaltai-audio";
/** Ресей — Эльмир Кулиев аудармасы (CDN 128 kbps). */
export const QURAN_RU_KULIEV_EDITION = "ru.kuliev-audio";
/** Ағылшын — Ibrahim Walk (CDN 192 kbps). */
export const QURAN_EN_WALK_EDITION = "en.walk";
/** Түркия — Дианет вақфы аудармасы (CDN 128 kbps). */
export const QURAN_TR_DIYANET_EDITION = "tr.vakfi-audio";
/** Қырғызстан — Хакимов (RAQAT CDN 128 kbps). */
export const QURAN_KY_HAKIMOV_AUDIO_EDITION = "ky.hakimov-audio";
/** Өзбекстан — Rowwad аудармасы (RAQAT CDN 128 kbps). */
export const QURAN_UZ_RWWAD_AUDIO_EDITION = "uz.rwwad-audio";

/** Аударма дауыстары (islamic.network + RAQAT CDN). */
export const QURAN_TRANSLATION_RECITER_OPTIONS: QuranReciterOption[] = [
  {
    edition: QURAN_KK_HALIFAH_ALTAI_EDITION,
    labelKk: "Халифа Алтай — қазақша аударма",
    group: "kk",
    kind: "translation",
    audioAvailable: true,
  },
  {
    edition: QURAN_RU_KULIEV_EDITION,
    labelKk: "Эльмир Кулиев — орысша аударма",
    group: "ru",
    kind: "translation",
    audioAvailable: true,
  },
  {
    edition: QURAN_EN_WALK_EDITION,
    labelKk: "Ibrahim Walk — ағылшынша аударма",
    group: "en",
    kind: "translation",
    audioAvailable: true,
  },
  {
    edition: QURAN_TR_DIYANET_EDITION,
    labelKk: "Дианет вақфы — түрікше аударма",
    group: "tr",
    kind: "translation",
    audioAvailable: true,
  },
  {
    edition: QURAN_KY_HAKIMOV_AUDIO_EDITION,
    labelKk: "Хакимов — қырғызша аударма",
    group: "ky",
    kind: "translation",
    audioAvailable: true,
  },
  {
    edition: QURAN_UZ_RWWAD_AUDIO_EDITION,
    labelKk: "Rowwad — өзбекше аударма",
    group: "uz",
    kind: "translation",
    audioAvailable: true,
  },
];

/**
 * Араб қарилары: Quran.com timed (karaoke) + islamic.network CDN.
 * Timed binding жоқ қарилар аят сайын CDN арқылы ойнайды.
 */
const ARABIC_RECITER_OPTIONS: QuranReciterOption[] = [
  { edition: "ar.abdurrahmaansudais", labelKk: "Әбдіррахман Ас-Судәис", group: "ar", kind: "arabic", audioAvailable: true },
  { edition: "ar.abdulbasitmurattal", labelKk: "Қари Әбділбасит (мұратаал)", group: "ar", kind: "arabic", audioAvailable: true },
  { edition: QURAN_HUSARY_EDITION, labelKk: "Махмуд Халил әл-Хусари", group: "ar", kind: "arabic", audioAvailable: true },
  { edition: QURAN_ALAFASY_EDITION, labelKk: "Мишари Рашид әл-Афаси", group: "ar", kind: "arabic", audioAvailable: true },
  { edition: QURAN_MAHER_MUAIQLY_EDITION, labelKk: "Махер әл-Муайкли", group: "ar", kind: "arabic", audioAvailable: true },
  { edition: "ar.minshawi", labelKk: "Мухаммад Сыддық әл-Миншауи", group: "ar", kind: "arabic", audioAvailable: true },
  { edition: "ar.hudhaify", labelKk: "Али әл-Хузайфи", group: "ar", kind: "arabic", audioAvailable: true },
  { edition: "ar.ahmedajamy", labelKk: "Ахмед әл-Аджами", group: "ar", kind: "arabic", audioAvailable: true },
  { edition: "ar.shaatree", labelKk: "Әбу Бәкр әш-Шатри", group: "ar", kind: "arabic", audioAvailable: true },
  { edition: "ar.muhammadayyoub", labelKk: "Мухаммад Аюб", group: "ar", kind: "arabic", audioAvailable: true },
];

/** Қари тізімі: алдымен аударма дауысы, кейін араб қарилары. */
export const QURAN_RECITER_OPTIONS: QuranReciterOption[] = [
  ...QURAN_TRANSLATION_RECITER_OPTIONS,
  ...ARABIC_RECITER_OPTIONS,
];

/** Ойнатылатын (audioAvailable) қарилар — CDN verify / download үшін. */
export const QURAN_PLAYABLE_RECITER_EDITIONS: string[] = QURAN_RECITER_OPTIONS.filter(
  (o) => o.audioAvailable
).map((o) => o.edition);

export const QURAN_RECITER_GROUP_ORDER: QuranReciterGroup[] = ["kk", "ru", "en", "tr", "ky", "uz", "ar"];

export const QURAN_RECITER_GROUP_LABELS_KK: Record<QuranReciterGroup, string> = {
  kk: "Қазақстан — қазақша аударма",
  ru: "Ресей — орысша аударма",
  en: "Ағылшынша аударма",
  tr: "Түркия — түрікше аударма",
  ky: "Қырғызстан — қырғызша аударма",
  uz: "Өзбекстан — өзбекше аударма",
  ar: "Араб қарилары (тәжуид)",
};

export function quranReciterGroupLabelKk(group: QuranReciterGroup): string {
  return QURAN_RECITER_GROUP_LABELS_KK[group];
}

export function findQuranReciterOption(edition: string): QuranReciterOption | undefined {
  const raw = (edition ?? "").trim();
  const normalized = raw === QURAN_ABDULRAHMAN_MOSSAD_EDITION ? QURAN_HUSARY_EDITION : raw;
  return QURAN_RECITER_OPTIONS.find((o) => o.edition === normalized);
}

export function isQuranReciterAudioAvailable(edition: string): boolean {
  const opt = findQuranReciterOption(edition);
  return opt?.audioAvailable === true;
}

export function isQuranTranslationReciterEdition(edition: string): boolean {
  return findQuranReciterOption(edition)?.kind === "translation";
}

const LOCALE_DEFAULT_RECITER: Partial<Record<AppLocale, string>> = {
  kk: QURAN_KK_HALIFAH_ALTAI_EDITION,
  ru: QURAN_RU_KULIEV_EDITION,
  en: QURAN_EN_WALK_EDITION,
  ky: QURAN_KY_HAKIMOV_AUDIO_EDITION,
  uz: QURAN_UZ_RWWAD_AUDIO_EDITION,
  tr: QURAN_TR_DIYANET_EDITION,
};

/** Қолданба тілі бойынша әдепкі аударма дауысы (сақталмаған болса). */
export function defaultReciterEditionForAppLocale(locale: AppLocale): string {
  const pick = LOCALE_DEFAULT_RECITER[locale];
  if (pick && isQuranReciterAudioAvailable(pick)) return pick;
  if (isQuranReciterAudioAvailable(QURAN_KK_HALIFAH_ALTAI_EDITION)) {
    return QURAN_KK_HALIFAH_ALTAI_EDITION;
  }
  return DEFAULT_QURAN_RECITER_EDITION;
}

export function normalizeReciterEdition(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return DEFAULT_QURAN_RECITER_EDITION;
  if (s === QURAN_ABDULRAHMAN_MOSSAD_EDITION) return QURAN_HUSARY_EDITION;
  if (!QURAN_RECITER_OPTIONS.some((o) => o.edition === s)) return DEFAULT_QURAN_RECITER_EDITION;
  if (!isQuranReciterAudioAvailable(s)) {
    return isQuranReciterAudioAvailable(QURAN_KK_HALIFAH_ALTAI_EDITION)
      ? QURAN_KK_HALIFAH_ALTAI_EDITION
      : DEFAULT_QURAN_RECITER_EDITION;
  }
  return s;
}
