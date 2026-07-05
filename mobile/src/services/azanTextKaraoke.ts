type AzanKaraokeBlock = { id: string; repeat?: string };

/** Азan MP3 ішіндегі әр фразаның салыстырмалы салмағы (дуа аудиода жоқ). */
const AZAN_KARAOKE_WEIGHTS: Record<string, number> = {
  "takbir-open": 38,
  "shahada-tawhid": 11,
  "shahada-risala": 11,
  "hayya-salah": 9,
  "hayya-falah": 9,
  "fajr-extra": 9,
  "takbir-close": 7,
  tahlil: 7,
};

export function azanKaraokeBlockWeight(block: Pick<AzanKaraokeBlock, "id" | "repeat">): number {
  return AZAN_KARAOKE_WEIGHTS[block.id] ?? (block.repeat ? 9 : 7);
}

/** Дуа блокты аудио біткенше караокеге қоспаймыз — MP3 клипте жоқ. */
export function azanKaraokeBlocks<T extends AzanKaraokeBlock>(blocks: readonly T[]): T[] {
  const duaIdx = blocks.findIndex((b) => b.id === "azan-dua");
  return duaIdx >= 0 ? blocks.slice(0, duaIdx) : [...blocks];
}

export function azanDuaBlockIndex<T extends AzanKaraokeBlock>(blocks: readonly T[]): number {
  return blocks.findIndex((b) => b.id === "azan-dua");
}

/**
 * Азan дыбысының нақты позициясына сәйкес белсенді жол индексі.
 * positionMs/durationMs арқылы — мәтін дыбыстан алда кетпейді.
 */
export function activeAzanTextIndexFromPlayback<T extends AzanKaraokeBlock>(
  blocks: readonly T[],
  positionMs: number,
  durationMs: number,
  isPlaying: boolean
): number {
  if (blocks.length === 0) return 0;

  const duaIdx = azanDuaBlockIndex(blocks);
  const karaokeBlocks = azanKaraokeBlocks(blocks);

  if (duaIdx >= 0 && !isPlaying && durationMs > 0 && positionMs >= durationMs - 250) {
    return duaIdx;
  }

  if (durationMs <= 0 || karaokeBlocks.length === 0) return 0;

  const progress = Math.max(0, Math.min(0.995, positionMs / durationMs));
  const weights = karaokeBlocks.map((b) => azanKaraokeBlockWeight(b));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return 0;

  let cumulative = 0;
  for (let i = 0; i < karaokeBlocks.length; i++) {
    cumulative += weights[i] / total;
    if (progress < cumulative) {
      return i;
    }
  }
  return karaokeBlocks.length - 1;
}
