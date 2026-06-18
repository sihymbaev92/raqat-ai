import { Platform } from "react-native";
import * as Speech from "expo-speech";

export type ArabicTtsOptions = {
  language: string;
  voice?: string;
};

export type ArabicTtsResolveOptions = {
  /** Тәжуид әріптері — еркек дауыс (немесе төмен pitch fallback). */
  preferMale?: boolean;
};

type VoiceRow = {
  identifier?: string;
  language?: string;
  quality?: string;
  name?: string;
};

let cachedDefault: ArabicTtsOptions | null = null;
let cachedMale: ArabicTtsOptions | null = null;
let inflightDefault: Promise<void> | null = null;
let inflightMale: Promise<void> | null = null;

function voiceBlob(v: VoiceRow): string {
  return `${(v.identifier ?? "").toLowerCase()} ${(v.name ?? "").toLowerCase()}`;
}

/** Жүйелік әйел дауыстары — әріп TTS-те қолданылмайды. */
export function isLikelyFemaleArabicVoice(v: VoiceRow): boolean {
  const b = voiceBlob(v);
  return /female|woman|salma|layla|laila|leila|amira|zuzana|zira|hala|mouna|noura|nora|zeina|zeinab|ayesha|aisha|fatima|mariam|maryam|meera|zahra|lina|lamia|hoda|rana|samira|yasmin|yasmine|nada|sara|sarah|safiya|-afb-|wavenet-a|wavenet-c|wavenet-e|wavenet-f|chirp3-hd-achird|chirp3-hd-aoede|chirp3-hd-kore|chirp3-hd-laomedeia|chirp3-hd-leda|chirp3-hd-sulafat/.test(
    b
  );
}

/** iOS Maged, Android ar-xa-x-arz-local және т.б. */
export function isLikelyMaleArabicVoice(v: VoiceRow): boolean {
  const b = voiceBlob(v);
  return /male|man\b|maged|majed|majid|tarik|tariq|khalid|khaled|ahmed|omar|hamid|hussein|ziad|youssef|yusuf|hazem|murad|najm|bahri|moaz|saad|fahd|ramy|-arb-|-ar[bcdij]-|ar-xa-x-ar[bcdij]|-arz-local|ar-xa-x-arz|wavenet-b|wavenet-d|wavenet-i|wavenet-j|chirp3-hd-charon|chirp3-hd-fenrir|chirp3-hd-enceladus|chirp3-hd-orus|chirp3-hd-puck/.test(
    b
  );
}

function scoreArabicVoice(v: VoiceRow, preferMale: boolean): number {
  const l = (v.language ?? "").toLowerCase().replace(/_/g, "-");
  const blob = voiceBlob(v);
  let s = 0;
  if (l.startsWith("ar-sa")) {
    s += 120;
  } else if (l.startsWith("ar-ae")) {
    s += 112;
  } else if (l.startsWith("ar-001") || l.startsWith("ar-xa")) {
    s += 100;
  } else if (l === "ar" || l.startsWith("ar-")) {
    s += 88;
  }
  if (/arab|saudi|mecca|qf|tarik|khalid|maged|bahri|oae|ar[bcdij]|arz-local|arb-local|chirp3-hd/.test(blob)) {
    s += 18;
  }
  if (isLikelyMaleArabicVoice(v)) {
    s += preferMale ? 64 : 48;
  }
  if (isLikelyFemaleArabicVoice(v)) {
    s -= preferMale ? 160 : 96;
  }
  if (String(v.quality ?? "") === "Enhanced") {
    s += 14;
  }
  return s;
}

function normalizeArabicLang(raw: string | undefined): string {
  let lang = (raw ?? "ar-SA").replace(/_/g, "-");
  if (!lang.toLowerCase().startsWith("ar")) {
    lang = "ar-SA";
  }
  return lang;
}

/** Қолжетімді дауыстар тізімінен ең қолайлы араб дауысын таңдайды (тест үшін экспорт). */
export function pickArabicVoiceFromList(
  voices: VoiceRow[],
  preferMale: boolean
): ArabicTtsOptions {
  const fallback: ArabicTtsOptions = { language: "ar-SA" };
  const arVoices = voices.filter((v) => {
    const l = (v.language ?? "").toLowerCase();
    return l === "ar" || l.startsWith("ar-");
  });
  if (!arVoices.length) {
    return fallback;
  }

  const maleVoices = arVoices.filter((v) => isLikelyMaleArabicVoice(v) && !isLikelyFemaleArabicVoice(v));
  const nonFemale = arVoices.filter((v) => !isLikelyFemaleArabicVoice(v));

  let pool: VoiceRow[];
  if (preferMale) {
    pool = maleVoices.length > 0 ? maleVoices : nonFemale.length > 0 ? nonFemale : arVoices;
  } else {
    pool = maleVoices.length > 0 ? maleVoices : nonFemale.length > 0 ? nonFemale : arVoices;
  }

  const ranked = [...pool].sort((a, b) => scoreArabicVoice(b, preferMale) - scoreArabicVoice(a, preferMale));
  const best = ranked[0];
  const lang = normalizeArabicLang(best.language);
  const voiceId = best.identifier?.trim();
  if (voiceId) {
    return { language: lang, voice: voiceId };
  }
  return { language: lang };
}

async function loadAvailableVoices(): Promise<VoiceRow[]> {
  const attempts = Platform.OS === "android" ? 4 : 1;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const voices = (await Speech.getAvailableVoicesAsync()) as VoiceRow[];
      if (voices.length > 0) {
        return voices;
      }
    } catch {
      /* retry */
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 350 * (i + 1)));
    }
  }
  return [];
}

async function resolveArabicTtsOptionsInner(preferMale: boolean): Promise<ArabicTtsOptions> {
  const cache = preferMale ? cachedMale : cachedDefault;
  if (cache) {
    return cache;
  }

  let inflight = preferMale ? inflightMale : inflightDefault;
  if (inflight) {
    await inflight;
    const after = preferMale ? cachedMale : cachedDefault;
    if (after) {
      return after;
    }
  }

  const fallback: ArabicTtsOptions = { language: "ar-SA" };
  const job = (async () => {
    try {
      const voices = await loadAvailableVoices();
      const picked = voices.length ? pickArabicVoiceFromList(voices, preferMale) : fallback;
      if (preferMale) {
        cachedMale = picked;
      } else {
        cachedDefault = picked;
      }
    } catch {
      if (preferMale) {
        cachedMale = fallback;
      } else {
        cachedDefault = fallback;
      }
    }
  })();

  if (preferMale) {
    inflightMale = job;
  } else {
    inflightDefault = job;
  }

  try {
    await job;
  } finally {
    if (preferMale) {
      inflightMale = null;
    } else {
      inflightDefault = null;
    }
  }

  return (preferMale ? cachedMale : cachedDefault) ?? fallback;
}

/**
 * Тәжуид тыңдауы: ar-SA / ar-AE, еркек дауыс артықшылықты.
 * preferMale: true — әріп TTS (қатаң еркек таңдау + pitch fallback).
 */
export async function resolveArabicTtsOptions(
  opts: ArabicTtsResolveOptions = {}
): Promise<ArabicTtsOptions> {
  return resolveArabicTtsOptionsInner(Boolean(opts.preferMale));
}

let cachedArabicAvailable: boolean | null = null;

/**
 * Құрылғыда нақты араб (ar*) TTS дауысы бар ма?
 * Жоқ болса — `ar-SA` тілінде Speech.speak үнсіз сәтсіз болады (дыбыс шықпайды, қате де жоқ).
 * Осыны алдын ала тексеріп, шақырушы естілетін резервке (қазақша әріп атауы) ауыса алады.
 */
export async function isArabicTtsAvailable(): Promise<boolean> {
  if (cachedArabicAvailable != null) {
    return cachedArabicAvailable;
  }
  if (Platform.OS === "web") {
    await waitForWebVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      cachedArabicAvailable = window.speechSynthesis
        .getVoices()
        .some((v) => (v.lang ?? "").toLowerCase().startsWith("ar"));
      return cachedArabicAvailable;
    }
  }
  try {
    const voices = await loadAvailableVoices();
    cachedArabicAvailable = voices.some((v) => {
      const l = (v.language ?? "").toLowerCase();
      return l === "ar" || l.startsWith("ar-");
    });
  } catch {
    cachedArabicAvailable = false;
  }
  return cachedArabicAvailable ?? false;
}

export function resetArabicTtsVoiceCache(): void {
  cachedDefault = null;
  cachedMale = null;
  cachedArabicAvailable = null;
}

/** Тәжуид TTS мәтінін қысқартады (тыныс белгілерін нормализациялайды). */
export function prepareTajweedArabicSpeech(input: string): string {
  let t = (input ?? "").trim().replace(/\s+/g, " ");
  if (!t) {
    return t;
  }
  t = t.replace(/\s*,\s*/g, " ، ");
  t = t.replace(/\s*،\s*،\s*/g, " ، ");
  return t.trim();
}

export type TajweedArabicSpeakOptions = {
  language: string;
  voice?: string;
  rate: number;
  pitch: number;
};

/** Тәжуид оқу параметрлері; preferMale — әріптер үшін төмен pitch fallback. */
export function buildTajweedArabicSpeakOptions(
  opt: ArabicTtsOptions,
  opts: { preferMale?: boolean } = {}
): TajweedArabicSpeakOptions {
  const raw = (opt.language ?? "ar-SA").replace(/_/g, "-");
  const language = raw.toLowerCase().startsWith("ar") ? raw : "ar-SA";
  const voiceId = opt.voice?.trim();
  const hasVoice = Boolean(voiceId);
  const preferMale = Boolean(opts.preferMale);

  let pitch: number;
  if (preferMale) {
    if (hasVoice) {
      pitch = Platform.OS === "android" ? 0.96 : 0.92;
    } else {
      pitch = Platform.OS === "android" ? 0.92 : 0.88;
    }
  } else {
    pitch = Platform.OS === "android" ? 0.99 : 0.97;
  }

  /** Android TTS: voice ID жиі сәтсіз — тек iOS/web; Android тек language+pitch. */
  const useVoice =
    (Platform.OS === "ios" || Platform.OS === "web") && hasVoice;

  return {
    language,
    ...(useVoice ? { voice: voiceId } : {}),
    rate: Platform.OS === "android" ? 0.85 : 0.78,
    pitch,
  };
}

const WEB_AR_SPEECH_RATE = 0.85;

function pickWebArabicVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return undefined;
  }
  const voices = window.speechSynthesis.getVoices();
  const arVoices = voices.filter((v) => (v.lang ?? "").toLowerCase().startsWith("ar"));
  if (!arVoices.length) {
    return undefined;
  }
  const male = arVoices.find((v) =>
    /male|maged|majed|tarik|khalid|arabic/i.test(`${v.name} ${v.voiceURI}`)
  );
  return male ?? arVoices[0];
}

/** Web: дауыстар тізімін жүктеу (бірінші тапта бос болуы мүмкін). */
export function primeWebSpeechVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

/** Chrome/Edge: getVoices() алғашқы шақыруда бос — күтеміз. */
export function waitForWebVoices(maxMs = 2800): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const synth = window.speechSynthesis;
    const done = () => {
      synth.onvoiceschanged = null;
      resolve();
    };
    const hasVoices = () => synth.getVoices().length > 0;
    if (hasVoices()) {
      resolve();
      return;
    }
    synth.getVoices();
    const prev = synth.onvoiceschanged;
    synth.onvoiceschanged = (ev: Event) => {
      prev?.call(synth, ev);
      synth.getVoices();
      if (hasVoices()) done();
    };
    setTimeout(done, maxMs);
  });
}

/** Web Speech API — expo-speech бір әріпте сенімсіз. */
export async function speakWebArabicUtterance(text: string): Promise<void> {
  await waitForWebVoices();
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Web Speech API unavailable"));
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      resolve();
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    if (synth.paused) {
      synth.resume();
    }
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = "ar-SA";
    utterance.rate = WEB_AR_SPEECH_RATE;
    utterance.volume = 1;
    const voice = pickWebArabicVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "ar-SA";
    }
    let settled = false;
    const finish = (ok: boolean, err?: string) => {
      if (settled) return;
      settled = true;
      if (ok) resolve();
      else reject(new Error(err ?? "web speech synthesis failed"));
    };
    utterance.onend = () => finish(true);
    utterance.onerror = (e) => {
      const code = (e as SpeechSynthesisErrorEvent)?.error ?? "";
      if (code === "interrupted" || code === "canceled") {
        finish(true);
        return;
      }
      finish(false, code || "web speech synthesis failed");
    };
    synth.speak(utterance);
    /** Chrome: speak() кейде дереу paused — resume қайта шақыру. */
    if (synth.paused) {
      synth.resume();
    }
    setTimeout(() => {
      if (!settled && !synth.speaking) {
        finish(false, "speech did not start");
      }
    }, 900);
  });
}
