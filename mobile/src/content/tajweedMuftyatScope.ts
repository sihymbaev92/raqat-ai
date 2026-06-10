import {
  TAJWEED_MUFTYAT_PAGES,
  type TajweedMuftyatPage,
} from "./tajweedMuftyatPages";
import {
  TAJWEED_MUFTYAT_SECTIONS,
  type TajweedMuftyatSection,
} from "./tajweedMuftyatCatalog";

/** Мазмұннан алынып, қолданбада көрсетілмейтін бөлімдер. */
const EXCLUDED_SECTION_IDS = new Set([
  "foreword",
  "intro",
  "short-surahs",
  "ayahs",
  "duas",
  "namaz-duas",
  "misc-duas",
  "refs",
]);

/** Оқулықтағы алғашқы тәжуид парағы (харакаттар). */
export const TAJWEED_APP_FIRST_PAGE = 13;

/**
 * Тек тәжуид оқулығы: 13–77.
 * 1–12: мұқаба/алғысөз; 78+: сүрелер, дұға, намаз.
 */
export function isTajweedAppPage(page: number): boolean {
  if (page < TAJWEED_APP_FIRST_PAGE || page > 77) return false;
  return true;
}

export const TAJWEED_APP_PAGES: TajweedMuftyatPage[] = TAJWEED_MUFTYAT_PAGES.filter((p) =>
  isTajweedAppPage(p.page)
);

export const TAJWEED_APP_SECTIONS: TajweedMuftyatSection[] = TAJWEED_MUFTYAT_SECTIONS.filter(
  (s) => !EXCLUDED_SECTION_IDS.has(s.id) && isTajweedAppPage(s.startPage)
);

export const TAJWEED_APP_PAGE_COUNT = TAJWEED_APP_PAGES.length;

/** Мазмұн тізімі: бөлім тақырыбы + ішкі тараулар (isPart — тек топ, chapter — секіру). */
export type TajweedTocGroup = {
  id: string;
  part: TajweedMuftyatSection | null;
  chapters: TajweedMuftyatSection[];
};

export function buildTajweedTocGroups(sections: TajweedMuftyatSection[]): TajweedTocGroup[] {
  const groups: TajweedTocGroup[] = [];
  let current: TajweedTocGroup = { id: "preface", part: null, chapters: [] };

  for (const sec of sections) {
    if (sec.isPart) {
      if (current.chapters.length > 0 || current.part) {
        groups.push(current);
      }
      current = { id: sec.id, part: sec, chapters: [] };
    } else {
      current.chapters.push(sec);
    }
  }
  if (current.chapters.length > 0 || current.part) {
    groups.push(current);
  }
  return groups;
}

export function tajweedAppPageIndex(page: number): number {
  return TAJWEED_APP_PAGES.findIndex((p) => p.page === page);
}
