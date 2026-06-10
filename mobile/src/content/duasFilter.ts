import type { DuaBlock, DuaCategory } from "./duasCatalog";
import { pickBestTranslit } from "../utils/translitKk";

/** Іздеу жолы бойынша дұға санатын сүзеді (түпнұсқа массивті өзгертпейді). */
export function filterDuaCategoriesByQuery(categories: DuaCategory[], searchQuery: string): DuaCategory[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return categories;
  return categories
    .map((cat) => ({
      ...cat,
      blocks: cat.blocks.filter((b: DuaBlock) => {
        const translit = pickBestTranslit(b.ar, b.translitKk);
        const hay = `${b.title} ${b.ar} ${b.meaningKk} ${translit}`.toLowerCase();
        return hay.includes(q);
      }),
    }))
    .filter((cat) => cat.blocks.length > 0);
}
