/** muftyat.kz PDF/OCR қазақ мәтінін UI және TTS үшін түзету. */

const KK = "[а-яёәіңғүұқөһ]";
const HYPHEN_BREAK = new RegExp(`(${KK})-\\n(${KK})`, "giu");
const DIGIT_HYPHEN_KK = new RegExp(`(\\d)-\\n(${KK})`, "giu");
const DIGIT_HYPHEN_DIGIT = /(\d)-\n(\d)/g;
const HYPHEN_DOT = new RegExp(`(${KK})-+\\.\\s*(${KK})`, "giu");
const SPACED_HYPHEN = new RegExp(`(${KK})\\s+-\\s+(${KK})`, "giu");
const LETTER_SPACED =
  /[А-ЯӘІҢҒҮҰҚӨҺа-яёәіңғүұқөһ](?:[ \t]+[А-ЯӘІҢҒҮҰҚӨҺа-яёәіңғүұқөһ]){2,}/gu;
const GLUED_FOOTNOTE = new RegExp(`(${KK})([А-ЯӘІҢҒҮҰҚӨҺ])`, "g");

const TYPO_REPLACEMENTS: Array<[RegExp, string]> = [
  [/кажет/giu, "қажет"],
  [/Тиләует/g, "Тіләуат"],
  [/әр\s*\.\s*қайсысына/giu, "әрқайсысына"],
];

function collapseLetterSpaced(match: string): string {
  return match.replace(/\s+/g, "");
}

function applyTypoMap(text: string): string {
  let t = text;
  for (const [re, rep] of TYPO_REPLACEMENTS) {
    t = t.replace(re, rep);
  }
  return t;
}

function mergeHyphenBreaks(text: string): string {
  return text
    .replace(HYPHEN_BREAK, "$1$2")
    .replace(DIGIT_HYPHEN_KK, "$1$2")
    .replace(DIGIT_HYPHEN_DIGIT, "$1-$2");
}

function applyCoreFixes(text: string): string {
  let t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = mergeHyphenBreaks(t);
  t = t.replace(HYPHEN_DOT, "$1$2");
  t = t.replace(SPACED_HYPHEN, "$1-$2");
  t = t.replace(LETTER_SPACED, collapseLetterSpaced);
  t = t.replace(GLUED_FOOTNOTE, "$1. $2");
  t = t.replace(/\s*\.\s*\./g, ".");
  t = t.replace(/\.{3,}/g, "…");
  t = applyTypoMap(t);
  t = t.replace(/[ \t]{2,}/g, " ");
  t = t.replace(/\s+([,.;:!?])/g, "$1");
  return t.trim();
}

/** Бір жол немесе TTS мәтіні. */
export function normalizeMuftyatKkText(input: string): string {
  const t = (input ?? "").trim();
  if (!t) return t;
  return applyCoreFixes(t);
}

/** Бет мәтіні — абзац (\n\n) сақталады. */
export function normalizeMuftyatKkPageText(input: string): string {
  let t = (input ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!t.trim()) return "";
  t = mergeHyphenBreaks(t);
  t = t.replace(HYPHEN_DOT, "$1$2");
  t = t.replace(SPACED_HYPHEN, "$1-$2");
  const paragraphs = t.split(/\n{2,}/);
  const out = paragraphs.map((p) => {
    const lines = p.split("\n").map((line) => normalizeMuftyatKkText(line));
    return lines.join("\n");
  });
  return out.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}
