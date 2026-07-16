type AzanKaraokeBlock = { id: string; repeat?: string };

/**
 * Азан клипі (~130с) бойынша фраза үлестері.
 * Басындағы тәкбір тым ұзақ тұрмасын, соңындағы тәкбір/тәһлил озып кетпесін.
 */
const AZAN_KARAOKE_SHARES: Record<string, number> = {
  "takbir-open": 0.22,
  "shahada-tawhid": 0.15,
  "shahada-risala": 0.15,
  "hayya-salah": 0.14,
  "hayya-falah": 0.14,
  "fajr-extra": 0.1,
  "takbir-close": 0.1,
  tahlil: 0.1,
};

/** Тест/салмақ салыстыру үшін — үлестерді бүтін салмаққа айналдыру. */
export function azanKaraokeBlockWeight(block: Pick<AzanKaraokeBlock, "id" | "repeat">): number {
  const share = AZAN_KARAOKE_SHARES[block.id];
  if (typeof share === "number") return Math.round(share * 100);
  return block.repeat ? 12 : 10;
}

/** Дуа блокты азан аудиосы кезінде караокеге қоспаймыз — бөлек MP3. */
export function azanKaraokeBlocks<T extends AzanKaraokeBlock>(blocks: readonly T[]): T[] {
  const duaIdx = blocks.findIndex((b) => b.id === "azan-dua");
  return duaIdx >= 0 ? blocks.slice(0, duaIdx) : [...blocks];
}

export function azanDuaBlockIndex<T extends AzanKaraokeBlock>(blocks: readonly T[]): number {
  return blocks.findIndex((b) => b.id === "azan-dua");
}

function karaokeSharesForBlocks(blocks: readonly AzanKaraokeBlock[]): number[] {
  const raw = blocks.map((b) => AZAN_KARAOKE_SHARES[b.id] ?? (b.repeat ? 0.12 : 0.1));
  const total = raw.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return raw.map(() => 1 / Math.max(1, raw.length));
  return raw.map((w) => w / total);
}

/**
 * Азан дыбысының нақты позициясына сәйкес белсенді жол индексі.
 * positionMs/durationMs арқылы — мәтін дыбыстан алда/артта қалмайды.
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

  // Басындағы қысқа үнсіздік/интро — бірінші жолда тұрамыз.
  const progress = Math.max(0, Math.min(0.999, positionMs / durationMs));
  if (progress < 0.008) return 0;

  const shares = karaokeSharesForBlocks(karaokeBlocks);
  let cumulative = 0;
  for (let i = 0; i < karaokeBlocks.length; i++) {
    cumulative += shares[i]!;
    if (progress < cumulative) {
      return i;
    }
  }
  return karaokeBlocks.length - 1;
}
