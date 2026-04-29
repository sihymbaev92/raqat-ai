const ARABIC_TO_KK_CYR_MAP: Record<string, string> = {
  ا: "а",
  أ: "а",
  إ: "и",
  آ: "аа",
  ب: "б",
  ت: "т",
  ث: "с",
  ج: "ж",
  ح: "х",
  خ: "х",
  د: "д",
  ذ: "з",
  ر: "р",
  ز: "з",
  س: "с",
  ش: "ш",
  ص: "с",
  ض: "д",
  ط: "т",
  ظ: "з",
  ع: "ғ",
  غ: "ғ",
  ف: "ф",
  ق: "қ",
  ك: "к",
  ل: "л",
  م: "м",
  ن: "н",
  ه: "һ",
  ة: "а",
  و: "у",
  ي: "й",
  ى: "а",
  ء: "ъ",
  ئ: "й",
  ؤ: "у",
  لا: "лә",
  " ": " ",
};

const LETTER_RE = /[A-Za-zА-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ]/;
const BAD_CHAR_RE = /[0-9_*=@#~|\\]/;
const ALLOWED_CHARS_RE = /^[A-Za-zА-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ'’`\-.,():;!?/ ]+$/;

export function arabicToKkCyrillicFallback(ar: string): string {
  const clean = ar
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .trim();
  if (!clean) return "";
  let out = "";
  for (let i = 0; i < clean.length; i += 1) {
    const pair = clean.slice(i, i + 2);
    if (ARABIC_TO_KK_CYR_MAP[pair]) {
      out += ARABIC_TO_KK_CYR_MAP[pair];
      i += 1;
      continue;
    }
    out += ARABIC_TO_KK_CYR_MAP[clean[i]] ?? clean[i];
  }
  return out.replace(/\s+/g, " ").trim();
}

export function normalizeTranslitText(raw?: string): string {
  let text = (raw ?? "")
    .replace(/[“”]/g, '"')
    .replace(/[«»]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  const hasCyr = /[А-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(text);
  const hasLat = /[A-Za-z]/.test(text);
  if (hasCyr && hasLat) {
    // Mixed-script typo guard: convert common Latin lookalikes into Cyrillic.
    const repl: Array<[RegExp, string]> = [
      [/a/g, "а"],
      [/A/g, "А"],
      [/c/g, "с"],
      [/C/g, "С"],
      [/e/g, "е"],
      [/E/g, "Е"],
      [/o/g, "о"],
      [/O/g, "О"],
      [/p/g, "р"],
      [/P/g, "Р"],
      [/x/g, "х"],
      [/X/g, "Х"],
      [/y/g, "у"],
      [/Y/g, "У"],
      [/k/g, "к"],
      [/K/g, "К"],
      [/m/g, "м"],
      [/M/g, "М"],
      [/t/g, "т"],
      [/T/g, "Т"],
      [/h/g, "һ"],
      [/H/g, "Һ"],
    ];
    for (const [re, to] of repl) text = text.replace(re, to);
  }
  return text;
}

export function isUsableTranslit(raw?: string): boolean {
  const t = normalizeTranslitText(raw);
  if (!t || t.length < 3) return false;
  if (!LETTER_RE.test(t)) return false;
  if (BAD_CHAR_RE.test(t)) return false;
  if (!ALLOWED_CHARS_RE.test(t)) return false;
  return true;
}

export function pickBestTranslit(ar: string, translitRaw?: string): string {
  const t = normalizeTranslitText(translitRaw);
  if (isUsableTranslit(t)) return t;
  return arabicToKkCyrillicFallback(ar);
}
