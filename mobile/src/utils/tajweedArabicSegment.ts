/** Араб мысал мәтінін нормализация (TTS/MP3 кілті). */

const COMBINING_RE = /[\u0640\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08F2]/;

function isCombining(ch: string): boolean {
  return COMBINING_RE.test(ch);
}

function isSkippableSeparator(ch: string): boolean {
  return /\s/.test(ch) || ch === "،" || ch === "," || ch === ".";
}

/**
 * «أَدَبَ» → ['أَ', 'دَ', 'بَ']; тест/анализ үшін.
 */
export function segmentTajweedArabicLetters(input: string): string[] {
  const text = (input ?? "").trim().normalize("NFC");
  if (!text) return [];

  const clusters: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (isSkippableSeparator(ch)) {
      i += 1;
      continue;
    }

    let cluster = ch;
    i += 1;
    while (i < text.length && isCombining(text[i])) {
      cluster += text[i];
      i += 1;
    }
    clusters.push(cluster);
  }
  return clusters;
}

/** TTS/MP3: NFC нормализация — ZWNJ/фатха hack жоқ (AI қате оқиды). */
export function prepareTajweedExampleSpeech(input: string): string {
  return (input ?? "").trim().normalize("NFC");
}
