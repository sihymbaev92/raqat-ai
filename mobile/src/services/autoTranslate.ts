/**
 * Автоматты (машиналық) аударма — қазақшадан қолдау көрсетілетін app тілдеріне.
 * ЕСКЕРТУ: бұл машиналық аударма, дәл емес болуы мүмкін. Дін/әдеби мәтінде
 * bundled offline dictionary басым саналады; қолданба runtime-да интернетке аударма сұрамайды.
 * Араб мәтіні мен транскрипция АУДАРЫЛМАЙДЫ (шақыратын жерде сүзіледі).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ensureOfflineAutoTranslationsLoaded,
  getOfflineAutoTranslation,
  hashAutoTranslateSource,
  type OfflineAutoTranslateTarget,
} from "./offlineAutoTranslations";
import { isUsableOfflineAutoTranslation } from "./offlineAutoTranslationSafety";

export type AutoTranslateTarget = OfflineAutoTranslateTarget;

const CACHE_PREFIX = "raqat_mt_v1_";
const UNAVAILABLE_BY_TARGET: Record<AutoTranslateTarget, string> = {
  ru: "Текст скоро будет переведен.",
  en: "This text will be translated soon.",
  ky: "Бул текст жакында которулат.",
  uz: "Bu matn tez orada tarjima qilinadi.",
  tr: "Bu metin yakında çevrilecek.",
  ar: "ستتم ترجمة هذا النص قريبًا.",
  zh: "此文本将很快翻译。",
  fa: "این متن به‌زودی ترجمه می‌شود.",
  id: "Teks ini akan segera diterjemahkan.",
  ms: "Teks ini akan diterjemahkan tidak lama lagi.",
  hi: "इस पाठ का जल्द अनुवाद किया जाएगा।",
  ku: "ئەم دەقە بە زوویی وەردەگێڕدرێت.",
};

function cacheKey(target: AutoTranslateTarget, text: string): string {
  return `${CACHE_PREFIX}${target}_${hashAutoTranslateSource(text)}`;
}

export function autoTranslationUnavailableText(target: AutoTranslateTarget): string {
  return UNAVAILABLE_BY_TARGET[target];
}

async function loadCached(target: AutoTranslateTarget, text: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(cacheKey(target, text));
  } catch {
    return null;
  }
}

/**
 * Бір мәтінді аудару (offline bundle + local cache ғана).
 * Сәтсіз болса null — шақырушы қазақшаны қалдырады, бірақ интернетке тәуелді болмайды.
 */
export async function autoTranslateText(
  text: string,
  target: AutoTranslateTarget
): Promise<string | null> {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;
  await ensureOfflineAutoTranslationsLoaded();
  const bundled = getOfflineAutoTranslation(trimmed, target);
  if (bundled) return bundled;

  const cached = await loadCached(target, trimmed);
  if (cached && isUsableOfflineAutoTranslation(cached)) return cached;
  return null;
}

/** Бірнеше мәтінді аудару; әрқайсысы сәтсіз болса сол элемент null. */
export async function autoTranslateMany(
  texts: string[],
  target: AutoTranslateTarget
): Promise<(string | null)[]> {
  const out: (string | null)[] = [];
  for (const t of texts) {
    out.push(await autoTranslateText(t, target));
  }
  return out;
}
