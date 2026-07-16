import { Platform } from "react-native";
import * as Speech from "expo-speech";
import { getMuftyatPageText } from "../content/tajweedMuftyatPageText";
import {
  buildTajweedArabicSpeakOptions,
  prepareTajweedArabicSpeech,
  primeWebSpeechVoices,
  resolveArabicTtsOptions,
} from "./tajweedArabicTts";
import { playTajweedLetterAudio, stopTajweedLetterAudio } from "./tajweedLetterAudioPlayer";
import { tajweedLetterSpeechAr } from "../content/tajweedAlphabet";

type VoiceRow = {
  identifier?: string;
  language?: string;
  quality?: string;
  name?: string;
};

let kkCached: { language: string; voice?: string } | null = null;
let kkCachedMale: { language: string; voice?: string } | null = null;
let activeKey: string | null = null;
let queueGen = 0;

const KK_LANG_CHAIN = ["kk-KZ", "kk", "ru-RU", "ru"] as const;

function scoreKazakhVoice(v: VoiceRow, preferMale: boolean): number {
  const l = (v.language ?? "").toLowerCase().replace(/_/g, "-");
  const name = `${v.name ?? ""} ${v.identifier ?? ""}`.toLowerCase();
  let s = 0;
  if (l.startsWith("kk-kz")) s += 120;
  else if (l === "kk") s += 100;
  else if (l.startsWith("ru")) s += 60;
  if (String(v.quality ?? "") === "Enhanced") s += 10;
  const maleHint = /male|муж|еркек|\bman\b|dmitry|иван|alexander|yuri|pavel|russian/.test(name);
  const femaleHint = /female|жен|әйел|woman|milena|irina|elena|tatyana|oksana/.test(name);
  if (preferMale) {
    if (maleHint) s += 80;
    if (femaleHint) s -= 120;
  }
  return s;
}

/** Қазақ оқу даусы — kk-KZ, kk, ru fallback. preferMale: әріп атаулары үшін. */
export async function resolveKazakhTtsOptions(
  opts: { preferMale?: boolean } = {}
): Promise<{ language: string; voice?: string }> {
  const preferMale = Boolean(opts.preferMale);
  const cached = preferMale ? kkCachedMale : kkCached;
  if (cached) return cached;
  const fallback = { language: "ru-RU" as const };
  try {
    const voices = (await Speech.getAvailableVoicesAsync()) as VoiceRow[];
    for (const lang of KK_LANG_CHAIN) {
      const pool = voices.filter((v) => {
        const l = (v.language ?? "").toLowerCase().replace(/_/g, "-");
        return l === lang.toLowerCase() || l.startsWith(`${lang.toLowerCase()}-`);
      });
      if (!pool.length) continue;
      const best = [...pool].sort(
        (a, b) => scoreKazakhVoice(b, preferMale) - scoreKazakhVoice(a, preferMale)
      )[0];
      const raw = (best.language ?? lang).replace(/_/g, "-");
      const useVoice = Platform.OS === "ios" && Boolean(best.identifier?.trim());
      const picked = useVoice
        ? { language: raw, voice: best.identifier!.trim() }
        : { language: raw };
      if (preferMale) kkCachedMale = picked;
      else kkCached = picked;
      return picked;
    }
  } catch {
    /* fallback */
  }
  if (preferMale) kkCachedMale = fallback;
  else kkCached = fallback;
  return fallback;
}

export function prepareMuftyatKkSpeech(input: string): string {
  let t = (input ?? "").trim();
  if (!t) return t;
  t = t
    .replace(/\s*\.\s*\./g, ". ")
    .replace(/([А-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ])-+\s*\.\s*([А-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ])/gu, "$1$2")
    .replace(/әр\s*\.\s*қайсысына/giu, "әрқайсысына")
    .replace(/кажет/giu, "қажет")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1");
  return t.trim();
}

function buildKkSpeakOptions(
  opt: { language: string; voice?: string },
  opts: { preferMale?: boolean } = {}
) {
  const language = opt.language.replace(/_/g, "-");
  const useVoice = Platform.OS === "ios" && Boolean(opt.voice?.trim());
  const preferMale = Boolean(opts.preferMale);
  return {
    language,
    ...(useVoice ? { voice: opt.voice } : {}),
    rate: Platform.OS === "android" ? 0.86 : 0.9,
    // Еркек дауыс жоқ болса да pitch төмендетіледі.
    pitch: preferMale ? (Platform.OS === "android" ? 0.82 : 0.88) : 1.0,
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

async function pauseAfterStop(): Promise<void> {
  await stopTajweedLetterAudio();
  await Speech.stop();
  if (Platform.OS === "android") {
    await new Promise((r) => setTimeout(r, 80));
  }
}

export function stopMuftyatSpeech(): void {
  queueGen += 1;
  activeKey = null;
  void Speech.stop();
  void stopTajweedLetterAudio();
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
    const kkText = prepareMuftyatKkSpeech(row.displayText || row.text);
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

/** Fallback: nameKk берілмесе — қазақша әріп атауы. */
const TAJWEED_LETTER_NAME_KK: Record<string, string> = {
  ا: "алиф",
  ب: "бә",
  ت: "тә",
  ث: "сә",
  ج: "жим",
  ح: "хә",
  خ: "хо",
  د: "дәл",
  ذ: "зәл",
  ر: "ро",
  ز: "зә",
  س: "син",
  ش: "шин",
  ص: "сод",
  ض: "дод",
  ط: "то",
  ظ: "зо",
  ع: "айн",
  غ: "ғойн",
  ف: "фә",
  ق: "қоф",
  ك: "кәф",
  ل: "ләм",
  م: "мим",
  ن: "нун",
  و: "уау",
  ه: "һә",
  ي: "йә",
};

/** Әліпби карточкалары: толық қазақша атау — «алиф», «бә», «тә»… */
export function prepareTajweedLetterSpeech(ar: string, nameKk?: string): string {
  const named = (nameKk ?? "").trim();
  if (named) return named;
  const letter = (ar ?? "").trim();
  return TAJWEED_LETTER_NAME_KK[letter] ?? letter;
}

/**
 * Әріп карточкасы — бандлдалған еркек араб дауысы (أَلِفْ، بَاء + махраж).
 * Жоқ/қате болса: тек араб TTS (бَا) — қазақша жүйелік TTS қате оқиды, қолданбаймыз.
 */
export async function speakTajweedLetter(
  ar: string,
  _example?: string,
  _nameKk?: string,
): Promise<boolean> {
  const gen = ++queueGen;
  const key = `letter-${ar}`;
  activeKey = key;
  const cancelled = () => gen !== queueGen || activeKey !== key;
  try {
    await pauseAfterStop();
    if (cancelled()) return false;

    // 1) Бандлдалған еркек араб MP3 (қайталап көру)
    for (let attempt = 0; attempt < 2; attempt++) {
      const played = await playTajweedLetterAudio(ar);
      if (cancelled()) return false;
      if (played) {
        if (gen === queueGen && activeKey === key) activeKey = null;
        return true;
      }
      await pauseAfterStop();
      if (cancelled()) return false;
    }

    // 2) Араб TTS: фатхалы дыбыс (жүйеде ar дауыс болса)
    const speechAr = tajweedLetterSpeechAr(ar);
    if (speechAr) {
      try {
        const arOpt = await resolveArabicTtsOptions({ preferMale: true });
        if (cancelled()) return false;
        const spoken = prepareTajweedArabicSpeech(speechAr);
        if (Platform.OS === "web") {
          const { speakWebArabicUtterance } = await import("./tajweedArabicTts");
          await speakWebArabicUtterance(spoken);
        } else {
          await speakOnce(spoken, buildTajweedArabicSpeakOptions(arOpt, { preferMale: true }));
        }
        if (gen === queueGen && activeKey === key) activeKey = null;
        return true;
      } catch {
        /* fail below */
      }
    }

    if (gen === queueGen) activeKey = null;
    return false;
  } catch {
    if (gen === queueGen) activeKey = null;
    return false;
  }
}

async function speakKkLetterOnceRobust(
  text: string,
  primaryOpt: { language: string; voice?: string }
): Promise<void> {
  const attempts = [
    buildKkSpeakOptions(primaryOpt, { preferMale: true }),
    buildKkSpeakOptions({ language: primaryOpt.language }, { preferMale: true }),
    buildKkSpeakOptions({ language: "ru-RU" }, { preferMale: true }),
    { language: "ru-RU", rate: 0.88, pitch: 0.8 },
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
  throw lastErr ?? new Error("KK TTS failed");
}

async function speakWebKazakhLetterName(text: string): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    throw new Error("no web speech");
  }
  primeWebSpeechVoices();
  await new Promise<void>((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "kk-KZ";
    u.rate = 0.9;
    u.pitch = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const male =
      voices.find((v) => /kk/i.test(v.lang) && /male|муж|ер/i.test(v.name)) ??
      voices.find((v) => /ru/i.test(v.lang) && /male|муж|dmitry|иван/i.test(v.name)) ??
      voices.find((v) => /kk|ru/i.test(v.lang));
    if (male) {
      u.voice = male;
      u.lang = male.lang || u.lang;
    }
    u.onend = () => resolve();
    u.onerror = () => reject(new Error("web speech error"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  });
}

/** Алфавит экраны ашылғанда дауыс тізімін алдын ала жүктеу. */
export function warmTajweedLetterSpeech(): void {
  if (Platform.OS === "web") {
    primeWebSpeechVoices();
  }
  void resolveKazakhTtsOptions({ preferMale: true });
}

export function isTajweedLetterSpeaking(ar: string): boolean {
  return activeKey === `letter-${ar}`;
}
