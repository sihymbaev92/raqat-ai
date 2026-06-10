/** Хатым FlatList: juz header vs surah row биіктіктері (scrollToOffset). */
export const HATIM_JUZ_HEADER_ROW_H = 36;
export const HATIM_SURAH_ROW_H = 76;

export type HatimListRowKind = "juzHeader" | "surah";

export type HatimListLayoutRow = {
  index: number;
  kind: HatimListRowKind;
  juz?: number;
  length: number;
  offset: number;
};

export function buildHatimListLayouts(
  rows: ReadonlyArray<{ kind: HatimListRowKind; juz?: number }>
): HatimListLayoutRow[] {
  let offset = 0;
  return rows.map((row, index) => {
    const length = row.kind === "juzHeader" ? HATIM_JUZ_HEADER_ROW_H : HATIM_SURAH_ROW_H;
    const layout: HatimListLayoutRow = {
      index,
      kind: row.kind,
      juz: row.juz,
      length,
      offset,
    };
    offset += length;
    return layout;
  });
}

export function hatimListIndexForJuz(
  layouts: readonly HatimListLayoutRow[],
  juz: number
): number {
  const row = layouts.find((l) => l.kind === "juzHeader" && l.juz === juz);
  return row?.index ?? -1;
}

export function hatimListIndexForSurah(
  layouts: readonly HatimListLayoutRow[],
  surahNumber: number,
  listRows: ReadonlyArray<{ kind: HatimListRowKind; row?: { number: number } }>
): number {
  const i = listRows.findIndex(
    (item) => item.kind === "surah" && item.row?.number === surahNumber
  );
  return i;
}

export function hatimScrollOffsetForIndex(
  layouts: readonly HatimListLayoutRow[],
  index: number,
  headerHeight: number
): number {
  const row = layouts[index];
  if (!row) return 0;
  return Math.max(0, headerHeight + row.offset - 8);
}
