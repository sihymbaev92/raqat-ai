/**
 * Аят аудиосы үшін «караоке».
 * Timestamp segments болса — Quran.com metadata; әйтпесе уақытқа пропорционал.
 */

/** Дыбысқа қарағанда жарықтану алда болсын — қаридан қалып кетпеу. */
export const KARAOKE_SYNC_LEAD_MS = 340;

/** Жарықтану уақыт прогрессінен сәл алда (1 = нақты, >1 = алда). */
export const KARAOKE_PROGRESS_SPEED = 1.06;

const ARABIC_COMBINING =
  /[\u064B-\u065F\u0670\u06D6-\u06ED\u08E3-\u08FF\u08F0-\u08F4\u08D3-\u08D7]/u;
const ARABIC_BASE = /[\u0621-\u064A\u0671-\u06D3\u06D5\u06EE-\u06EF\u06FA-\u06FC\u08A0-\u08FF]/u;

export function splitAyahArabicWords(arabic: string): string[] {
  const t = (arabic ?? "").trim();
  if (!t) return [];
  return t.split(/[\s\u00A0\u2009\u2003]+/).filter(Boolean);
}

/** progress01 ∈ [0,1] — қазір оқылып жатқан сөздің 0-based индексі */
export function karaokeWordIndexFromProgress(words: string[], progress01: number): number {
  if (!words.length) return 0;
  const p = Math.min(1, Math.max(0, progress01));
  const weights = words.map((w) => Math.max(1, Array.from(w).length));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  const target = p * total;
  let sum = 0;
  for (let i = 0; i < words.length; i++) {
    sum += weights[i]!;
    if (target <= sum) return i;
  }
  return words.length - 1;
}

/** Segmenter жоқ ортада: негіз әріп + жабысқан диакритика бір графема. */
function splitAyahArabicGraphemesFallback(t: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < t.length) {
    const ch = t[i]!;
    if (/\s/u.test(ch)) {
      out.push(ch);
      i++;
      continue;
    }
    let g = ch;
    i++;
    while (i < t.length && ARABIC_COMBINING.test(t[i]!)) {
      g += t[i];
      i++;
    }
    if (g.length === 1 && !ARABIC_BASE.test(g) && i < t.length && ARABIC_BASE.test(t[i]!)) {
      continue;
    }
    out.push(g);
  }
  return out;
}

/**
 * Аят мәтінін көрсету бірліктеріне бөлу (әріп + оған жабысқан тәшкил бір сегмент).
 * `Intl.Segmenter` болса графема; әйтпесе әріп+диакритика кластері.
 */
export function splitAyahArabicGraphemes(arabic: string): string[] {
  const t = (arabic ?? "").trim();
  if (!t) return [];
  try {
    const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
    if (typeof Seg === "function") {
      const seg = new Seg("ar", { granularity: "grapheme" });
      return Array.from(seg.segment(t), (x) => x.segment);
    }
  } catch {
    /* Hermes/ескі ортада Segmenter болмауы мүмкін */
  }
  return splitAyahArabicGraphemesFallback(t.normalize("NFC"));
}

export type AyahArabicWordBoundary = { start: number; end: number; word: string };

/** Сөздердің басталу/аяқтау позициялары (оригинал аралықтар сақталады). */
export function ayahArabicWordBoundaries(plainArabic: string): AyahArabicWordBoundary[] {
  const text = (plainArabic ?? "").trim();
  if (!text) return [];
  const words = splitAyahArabicWords(text);
  const bounds: AyahArabicWordBoundary[] = [];
  let searchFrom = 0;
  for (const w of words) {
    const start = text.indexOf(w, searchFrom);
    if (start < 0) break;
    bounds.push({ start, end: start + w.length, word: w });
    searchFrom = start + w.length;
  }
  return bounds;
}

/** progress01 ∈ [0,1] — қазіргі графеманың 0-based индексі (уақытқа тең үлестірілген) */
export function karaokeGraphemeIndexFromProgress(graphemes: string[], progress01: number): number {
  if (!graphemes.length) return 0;
  const p = Math.min(1, Math.max(0, progress01));
  const n = graphemes.length;
  return Math.min(n - 1, Math.round(p * Math.max(0, n - 1)));
}

function graphemeIndexLinearFromProgress01(graphemeCount: number, progress01: number): number {
  if (graphemeCount <= 0) return 0;
  const p = Math.min(1, Math.max(0, progress01));
  return Math.min(graphemeCount - 1, Math.round(p * Math.max(0, graphemeCount - 1)));
}

/**
 * Сөз бойынша прогресс → графема индексі (ағымдағы сөз ішінде бірге жылжиды).
 * plainArabic — экранда көрсетілетін араб мәтіні (displayCachedAyahArabic).
 */
export function graphemeHighlightIndexFromWordProgress(plainArabic: string, progress01: number): number {
  const text = (plainArabic ?? "").trim();
  const graphemes = splitAyahArabicGraphemes(text);
  if (!graphemes.length) return 0;

  const words = splitAyahArabicWords(text);
  if (words.length <= 1) {
    return graphemeIndexLinearFromProgress01(graphemes.length, progress01);
  }

  const wordIdx = karaokeWordIndexFromProgress(words, progress01);
  const weights = words.map((w) => Math.max(1, splitAyahArabicGraphemes(w).length));
  const total = weights.reduce((a, b) => a + b, 0);
  const target = Math.min(1, Math.max(0, progress01)) * total;
  const prevWeight = weights.slice(0, wordIdx).reduce((a, b) => a + b, 0);
  const curWeight = weights[wordIdx] ?? 1;
  const intra = curWeight > 0 ? (target - prevWeight) / curWeight : 1;
  const intraP = Math.min(1, Math.max(0, intra));

  let searchFrom = 0;
  let prefixGCount = 0;
  for (let i = 0; i < wordIdx; i++) {
    const w = words[i]!;
    const pos = text.indexOf(w, searchFrom);
    if (pos < 0) break;
    prefixGCount = splitAyahArabicGraphemes(text.slice(0, pos + w.length)).length;
    searchFrom = pos + w.length;
    while (searchFrom < text.length && /\s/u.test(text[searchFrom]!)) searchFrom++;
  }

  const currentWord = words[wordIdx] ?? "";
  const wordStart = text.indexOf(currentWord, searchFrom);
  if (wordStart < 0) {
    return graphemeIndexLinearFromProgress01(graphemes.length, progress01);
  }

  const wordGCount = splitAyahArabicGraphemes(currentWord).length;
  const within = wordGCount > 0 ? Math.max(1, Math.ceil(intraP * wordGCount)) : 1;
  const prefixAtWord = splitAyahArabicGraphemes(text.slice(0, wordStart)).length;

  return Math.min(graphemes.length - 1, prefixAtWord + within - 1);
}

function progress01FromMs(positionMs: number, durationMs: number, leadMs: number = KARAOKE_SYNC_LEAD_MS): number {
  if (durationMs <= 0) return 0;
  const adjusted = Math.min(durationMs, Math.max(0, positionMs) + leadMs);
  return Math.min(1, (adjusted / durationMs) * KARAOKE_PROGRESS_SPEED);
}

/** progress01 ∈ [0,1] — қазір оқылып жатқан сөздің 0-based индексі (plainArabic). */
export function karaokeWordIndexFromPlainProgress(plainArabic: string, progress01: number): number {
  const words = splitAyahArabicWords(plainArabic);
  return karaokeWordIndexFromProgress(words, progress01);
}

export type AyahWordTimestampSegment = readonly [number, number, number, number];

function scaleSegmentTimeMs(ms: number, refDur: number, actualDur: number): number {
  if (refDur <= 0 || actualDur <= 0 || Math.abs(refDur - actualDur) < 40) return ms;
  return Math.round((ms / refDur) * actualDur);
}

/** Quran.com segments → 0-based сөз индексі (positionMs — аят MP3 ішінде). */
export function karaokeWordIndexFromTimestampSegments(
  segments: readonly AyahWordTimestampSegment[],
  positionMs: number,
  wordCount: number,
  referenceDurationMs: number,
  actualDurationMs: number
): number {
  if (!segments.length || wordCount <= 0) return 0;
  const refDur = referenceDurationMs > 0 ? referenceDurationMs : segments[segments.length - 1]![3];
  const pos = Math.max(0, positionMs);

  for (const [w0, w1, startRaw, endRaw] of segments) {
    const start = scaleSegmentTimeMs(startRaw, refDur, actualDurationMs);
    const end = scaleSegmentTimeMs(endRaw, refDur, actualDurationMs);
    if (pos < start) continue;
    if (pos >= end) continue;
    const span = Math.max(1, w1 - w0);
    const intra = (pos - start) / Math.max(1, end - start);
    const idx = w0 + Math.floor(intra * span);
    return Math.min(wordCount - 1, Math.max(0, idx));
  }

  const last = segments[segments.length - 1]!;
  const lastEnd = scaleSegmentTimeMs(last[3], refDur, actualDurationMs);
  if (pos >= lastEnd) return wordCount - 1;
  return 0;
}

/** MP3 позициясынан караоке сөз индексі. */
export function karaokeWordIndexFromMs(positionMs: number, durationMs: number, plainArabic: string): number {
  if (durationMs <= 0) return 0;
  const p = progress01FromMs(positionMs, durationMs);
  return karaokeWordIndexFromPlainProgress(plainArabic, p);
}

/** Timestamp segments немесе proportional fallback. */
export function karaokeWordIndexFromPlaybackMs(
  positionMs: number,
  durationMs: number,
  plainArabic: string,
  segments?: readonly AyahWordTimestampSegment[] | null,
  referenceDurationMs?: number
): number {
  const words = splitAyahArabicWords(plainArabic);
  if (segments?.length && words.length > 0 && durationMs > 0) {
    return karaokeWordIndexFromTimestampSegments(
      segments,
      positionMs,
      words.length,
      referenceDurationMs ?? segments[segments.length - 1]![3],
      durationMs
    );
  }
  return karaokeWordIndexFromMs(positionMs, durationMs, plainArabic);
}

/**
 * MP3 позициясынан караоке индексі.
 * `plainArabic` берілсе — сөз ұзындығына пропорционал; әйтпесе тек графема саны (соңғы fallback).
 */
export function karaokeGraphemeIndexFromMs(
  positionMs: number,
  durationMs: number,
  graphemeCountOrPlain: number | string,
  segments?: readonly AyahWordTimestampSegment[] | null,
  referenceDurationMs?: number
): number {
  if (durationMs <= 0) return 0;

  if (typeof graphemeCountOrPlain === "string") {
    const plain = graphemeCountOrPlain;
    const wordIdx = karaokeWordIndexFromPlaybackMs(
      positionMs,
      durationMs,
      plain,
      segments,
      referenceDurationMs
    );
    const words = splitAyahArabicWords(plain);
    if (segments?.length && words.length > 1) {
      const weights = words.map((w) => Math.max(1, splitAyahArabicGraphemes(w).length));
      const total = weights.reduce((a, b) => a + b, 0);
      const target = weights.slice(0, wordIdx).reduce((a, b) => a + b, 0) + Math.max(1, weights[wordIdx] ?? 1) * 0.35;
      const p = total > 0 ? Math.min(1, target / total) : 0;
      return graphemeHighlightIndexFromWordProgress(plain, p);
    }
    const p = progress01FromMs(positionMs, durationMs);
    return graphemeHighlightIndexFromWordProgress(plain, p);
  }

  const p = progress01FromMs(positionMs, durationMs);
  const n = graphemeCountOrPlain;
  if (n <= 0) return 0;
  return graphemeIndexLinearFromProgress01(n, p);
}

/** Ойнату алға жылжығанда индекс артқа секірмейді (желілік караоке). */
export function karaokeGraphemeIndexMonotonicForward(
  nextIndex: number,
  previousIndex: number,
  positionMs: number,
  lastPositionMs: number
): number {
  if (previousIndex < 0) return nextIndex;
  if (positionMs + 80 < lastPositionMs) return nextIndex;
  return Math.max(previousIndex, nextIndex);
}

/** Сөз индексі артқа секірмейді. */
export function karaokeWordIndexMonotonicForward(
  nextIndex: number,
  previousIndex: number,
  positionMs: number,
  lastPositionMs: number
): number {
  return karaokeGraphemeIndexMonotonicForward(nextIndex, previousIndex, positionMs, lastPositionMs);
}
