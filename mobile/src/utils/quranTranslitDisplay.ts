import type { QuranTranslitScript } from "../quran/quranTranslitScript";
import { getQuranTranslitScript } from "../quran/quranTranslitScript";
import { transliterateArabicToKazakh } from "./arabicTranslitKk";
import { kkCyrillicPhoneticToLatin } from "./kkCyrillicPhoneticToLatin";

/**
 * Қазақ қорынын транскрипциясы кез келген стандартты кирилл блок әрпін қамтиды.
 * Тар regex `[а-я]` кейібір әріптерді жіберіп алуы мүмкін — сол үшін код нүктесі бойынша тексереміз.
 */
export function hasCyrillicScript(s: string): boolean {
  for (let idx = 0; idx < s.length; ) {
    const cp = s.codePointAt(idx)!;
    if (
      (cp >= 0x0400 && cp <= 0x052f) ||
      (cp >= 0x2de0 && cp <= 0x2dff) ||
      (cp >= 0xa640 && cp <= 0xa69f)
    ) {
      return true;
    }
    idx += cp > 0xffff ? 2 : 1;
  }
  return false;
}

/** Кирилл оқылу (бандл → арабтан алгоритм → шикі мәтін). */
export function resolveQuranTranslitKk(
  translitRaw: string | undefined,
  arabicText: string
): string {
  const tr = (translitRaw ?? "").trim();
  if (tr && hasCyrillicScript(tr)) return tr;
  const ar = (arabicText ?? "").trim();
  if (ar) return transliterateArabicToKazakh(ar);
  if (tr) return tr;
  return "";
}

/**
 * Көрсету: қазақ кирилл немесе латын (баптау бойынша).
 */
export function resolveQuranTranslitForDisplay(
  translitRaw: string | undefined,
  arabicText: string,
  script: QuranTranslitScript = getQuranTranslitScript()
): string {
  const kk = resolveQuranTranslitKk(translitRaw, arabicText);
  if (!kk) return "";
  return script === "latin" ? kkCyrillicPhoneticToLatin(kk) : kk;
}

/**
 * Біріктіру: бұрынғы кештегі asyldin кирилін API латынынан жоғары қоямыз.
 */
export function pickPreferredTranslit(prev: string, incoming: string): string {
  const p = prev.trim();
  const i = incoming.trim();
  if (hasCyrillicScript(p)) return p;
  if (hasCyrillicScript(i)) return i;
  return p || i;
}
