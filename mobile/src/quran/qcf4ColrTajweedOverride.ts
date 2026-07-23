import type { TajweedRuleKey } from "../utils/alquranTajweedParse";
import type { Qcf4Word } from "./qcf4Types";

const TANWEEN_RE = /[\u064B\u064C\u064D]/;
const IZHAR_FIRST_RE = /^(?:ء|أ|إ|ؤ|ئ|ه|ع|ح|غ|خ)/;

function wordText(word: Qcf4Word): string {
  return (word.text || word.char || "").trim();
}

function hasTanween(text: string): boolean {
  return TANWEEN_RE.test(text);
}

function firstArabicLetter(text: string): string | null {
  const stripped = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
  const match = stripped.match(/[\u0621-\u064A\u0671-\u06D3]/);
  return match?.[0] ?? null;
}

/** Hide COLR on izhar tanween pairs where API tags are more reliable than baked glyph ink. */
export function qcf4ColrSuppressTajweedColor(word: Qcf4Word, nextWord?: Qcf4Word): boolean {
  if (word.type !== "word") return false;
  if (!nextWord || nextWord.type !== "word") return false;
  const text = wordText(word);
  if (!hasTanween(text)) return false;
  const nextLetter = firstArabicLetter(wordText(nextWord));
  if (!nextLetter) return false;
  return IZHAR_FIRST_RE.test(nextLetter);
}

/**
 * Prefer Al Quran Cloud tag color over COLR only where COLR ink is known wrong
 * (ikhfa / tanween). Other rules keep COLR so multiple colors stay inside one
 * ligature glyph — nested Text letter spans break Arabic joining.
 */
export function qcf4ColrPreferApiTagOverColr(
  _word: Qcf4Word,
  _nextWord?: Qcf4Word,
  rule?: TajweedRuleKey
): boolean {
  return rule === "f";
}
