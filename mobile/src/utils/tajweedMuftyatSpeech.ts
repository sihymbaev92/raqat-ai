import { Platform } from "react-native";
import * as Speech from "expo-speech";
import { getMuftyatPageText } from "../content/tajweedMuftyatPageText";
import {
  buildTajweedArabicSpeakOptions,
  prepareTajweedArabicSpeech,
  resolveArabicTtsOptions,
} from "./tajweedArabicTts";

type VoiceRow = {
  identifier?: string;
  language?: string;
  quality?: string;
  name?: string;
};

let kkCached: { language: string; voice?: string } | null = null;
let activeKey: string | null = null;
let queueGen = 0;

const KK_LANG_CHAIN = ["kk-KZ", "kk", "ru-RU", "ru"] as const;

function scoreKazakhVoice(v: VoiceRow): number {
  const l = (v.language ?? "").toLowerCase().replace(/_/g, "-");
  let s = 0;
  if (l.startsWith("kk-kz")) s += 120;
  else if (l === "kk") s += 100;
  else if (l.startsWith("ru")) s += 60;
  if (String(v.quality ?? "") === "Enhanced") s += 10;
  return s;
}

/** Қазақ оқу даусы — kk-KZ, kk, ru fallback. */
export async function resolveKazakhTtsOptions(): Promise<{ language: string; voice?: string }> {
  if (kkCached) return kkCached;
  const fallback = { language: "ru-RU" as const };
  try {
    const voices = (await Speech.getAvailableVoicesAsync()) as VoiceRow[];
    for (const lang of KK_LANG_CHAIN) {
      const pool = voices.filter((v) => {
        const l = (v.language ?? "").toLowerCase().replace(/_/g, "-");
        return l === lang.toLowerCase() || l.startsWith(`${lang.toLowerCase()}-`);
      });
      if (!pool.length) continue;
      const best = [...pool].sort((a, b) => scoreKazakhVoice(b) - scoreKazakhVoice(a))[0];
      const raw = (best.language ?? lang).replace(/_/g, "-");
      const useVoice = Platform.OS === "ios" && Boolean(best.identifier?.trim());
      kkCached = useVoice ? { language: raw, voice: best.identifier!.trim() } : { language: raw };
      return kkCached;
    }
  } catch {
    /* fallback */
  }
  kkCached = fallback;
  return kkCached;
}

export function prepareMuftyatKkSpeech(input: string): string {
  let t = (input ?? "").trim();
  if (!t) return t;
  t = t.replace(/\s*\.\s*\./g, ". ");
  return t.trim();
}

function buildKkSpeakOptions(opt: { language: string; voice?: string }) {
  const language = opt.language.replace(/_/g, "-");
  const useVoice = Platform.OS === "ios" && Boolean(opt.voice?.trim());
  return {
    language,
    ...(useVoice ? { voice: opt.voice } : {}),
    rate: Platform.OS === "android" ? 0.88 : 0.92,
    pitch: 1.0,
  };
}

function buildKkLetterNameSpeakOptions(opt: { language: string; voice?: string }) {
  return {
    ...buildKkSpeakOptions(opt),
    rate: Platform.OS === "android" ? 0.78 : 0.82,
    pitch: 1.02,
    volume: 1.0,
  };
}

function speakOnce(text: string, options: object): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!text.trim()) {
      resolve();
      return;
    }
    Speech.speak(text, {
      ...options,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (e) => reject(e),
    });
  });
}

/** Дауыс ID сәтсіз болса — pitch/lang fallback ретімен қайта оқиды. */
async function speakOnceRobust(
  text: string,
  primary: ReturnType<typeof buildTajweedArabicSpeakOptions>
): Promise<void> {
  const attempts: Array<ReturnType<typeof buildTajweedArabicSpeakOptions>> = [
    primary,
    { language: primary.language, rate: primary.rate, pitch: Math.max(primary.pitch, 0.95) },
    { language: primary.language, rate: Platform.OS === "android" ? 0.9 : 0.85, pitch: 1.0 },
    { language: "ar-SA", rate: 0.9, pitch: 1.0 },
  ];
  const seen = new Set<string>();
  let lastErr: unknown;
  for (const opts of attempts) {
    const key = JSON.stringify(opts);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      await speakOnce(text, opts);
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("TTS failed");
}

async function pauseAfterStop(): Promise<void> {
  await Speech.stop();
  if (Platform.OS === "android") {
    await new Promise((r) => setTimeout(r, 80));
  }
}

export function stopMuftyatSpeech(): void {
  queueGen += 1;
  activeKey = null;
  void Speech.stop();
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
  }
}

export type MuftyatSpeechCallbacks = {
  onStart?: (page: number) => void;
  onDone?: (page: number) => void;
  onError?: (page: number, err: unknown) => void;
};

/** Бет мәтінін kk TTS, содан arabic сегменттерін ar TTS ретімен оқиды. */
export async function speakMuftyatPage(page: number, cb: MuftyatSpeechCallbacks = {}): Promise<void> {
  const row = getMuftyatPageText(page);
  if (!row?.text?.trim()) return;

  const gen = ++queueGen;
  const key = `page-${page}`;
  activeKey = key;
  cb.onStart?.(page);

  try {
    await pauseAfterStop();
    const kkOpt = await resolveKazakhTtsOptions();
    const arOpt = await resolveArabicTtsOptions();
    const kkText = prepareMuftyatKkSpeech(row.text);
    if (gen !== queueGen || activeKey !== key) return;

    if (kkText) {
      await speakOnce(kkText, buildKkSpeakOptions(kkOpt));
    }

    for (const seg of row.arabic) {
      if (gen !== queueGen || activeKey !== key) return;
      const arText = prepareTajweedArabicSpeech(seg);
      if (!arText) continue;
      await speakOnce(arText, buildTajweedArabicSpeakOptions(arOpt));
    }

    if (gen === queueGen && activeKey === key) {
      activeKey = null;
      cb.onDone?.(page);
    }
  } catch (err) {
    if (gen === queueGen) {
      activeKey = null;
      cb.onError?.(page, err);
    }
  }
}

export function isMuftyatPageSpeaking(page: number): boolean {
  return activeKey === `page-${page}`;
}

const TAJWEED_LETTER_SPEECH: Record<string, string> = {
  ا: "أَ",
  ب: "بَ",
  ت: "تَ",
  ث: "ثَ",
  ج: "جَ",
  ح: "حَ",
  خ: "خَ",
  د: "دَ",
  ذ: "ذَ",
  ر: "رَ",
  ز: "زَ",
  س: "سَ",
  ش: "شَ",
  ص: "صَ",
  ض: "ضَ",
  ط: "طَ",
  ظ: "ظَ",
  ع: "عَ",
  غ: "غَ",
  ف: "فَ",
  ق: "قَ",
  ك: "كَ",
  ل: "لَ",
  م: "مَ",
  ن: "نَ",
  و: "وَ",
  ه: "هَ",
  ي: "يَ",
};

export function prepareTajweedLetterSpeech(ar: string): string {
  const letter = (ar ?? "").trim();
  return TAJWEED_LETTER_SPEECH[letter] ?? letter;
}

export function prepareTajweedLetterNameSpeech(nameKk: string | undefined, ar: string): string {
  const name = prepareMuftyatKkSpeech((nameKk ?? "").trim());
  return name || prepareTajweedLetterSpeech(ar);
}

/**
 * Әріп карточкасы — мысал сөзді емес, таза әріп атауын оқиды: "алиф", "син", "шин", "ғойн"...
 */
export async function speakTajweedLetter(
  ar: string,
  _example?: string,
  nameKk?: string,
): Promise<boolean> {
  const gen = ++queueGen;
  const key = `letter-${ar}`;
  activeKey = key;
  const cancelled = () => gen !== queueGen || activeKey !== key;
  try {
    await pauseAfterStop();
    if (cancelled()) return false;

    const text = prepareTajweedLetterNameSpeech(nameKk, ar);
    if (!text) return false;

    try {
      const kkOpt = await resolveKazakhTtsOptions();
      if (cancelled()) return false;
      await speakOnce(text, buildKkLetterNameSpeakOptions(kkOpt));
    } catch {
      return false;
    }

    if (gen === queueGen && activeKey === key) activeKey = null;
    return true;
  } catch {
    if (gen === queueGen) activeKey = null;
    return false;
  }
}

/** Алфавит экраны ашылғанда дауыс тізімін алдын ала жүктеу (Android бос массив bug). */
export function warmTajweedLetterSpeech(): void {
  void resolveKazakhTtsOptions();
}

export function isTajweedLetterSpeaking(ar: string): boolean {
  return activeKey === `letter-${ar}`;
}
