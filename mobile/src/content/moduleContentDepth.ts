/**
 * Рухани модульдердің тереңдік стандарттары — біркелкі толықтық тексеруі.
 */
import { DUA_CATEGORIES } from "./duasCatalog";
import { HAJJ_BOOK_SECTIONS } from "./hajjBookContent";
import { HAJJ_MUFTYAT_PAGES } from "./hajjMuftyatPages";
import { TRADITION_TOPICS } from "./traditionTopicsCatalog";
import { SEERAH_LESSONS, SEERAH_PHASES, seerahOfflineCharCount } from "./seerahCurriculum";
import { SEERAH_LESSON_COUNT } from "../config/seerahVideos";
import { getKzTrustedHadithItems } from "./kzTrustedHadithCatalog";
import { loadDhikrItems } from "../screens/tasbihShared";

export type GuidanceModuleId =
  | "seerah"
  | "hajj"
  | "tradition"
  | "duas"
  | "tasbih"
  | "asma"
  | "hadith";

export type ModuleDepthSnapshot = {
  moduleId: GuidanceModuleId;
  labelKk: string;
  depthLineKk: string;
  phases?: number;
  lessons?: number;
  sections?: number;
  pages?: number;
  topics?: number;
  categories?: number;
  items?: number;
  offlineChars: number;
};

export const GUIDANCE_DEPTH_MINIMUMS = {
  seerah: { phases: 7, lessons: 38, minSummaryChars: 30, offlineChars: 4000 },
  hajj: { sections: 20, pages: 100, offlineChars: 8000 },
  tradition: { topics: 30, minSummaryChars: 20, offlineChars: 10000 },
  duas: { categories: 8, minBlocks: 1, offlineChars: 2000 },
  tasbih: { items: 5, offlineChars: 500 },
  asma: { names: 99, offlineChars: 3000 },
  hadith: { items: 50, offlineChars: 5000 },
} as const;

function loadAsmaRows(): { n: number; ar: string; kk: string }[] {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const raw = require("../../assets/bundled/asma-al-husna-kk.json") as { n: number; ar: string; kk: string }[];
    /* eslint-enable @typescript-eslint/no-require-imports */
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function getModuleDepthSnapshot(moduleId: GuidanceModuleId): ModuleDepthSnapshot {
  switch (moduleId) {
    case "seerah":
      return {
        moduleId,
        labelKk: "Сира",
        depthLineKk: `${SEERAH_PHASES.length} кезең · ${SEERAH_LESSONS.length} сабақ · офлайн мәтін`,
        phases: SEERAH_PHASES.length,
        lessons: SEERAH_LESSONS.length,
        offlineChars: seerahOfflineCharCount(),
      };
    case "hajj":
      return {
        moduleId,
        labelKk: "Қажылық",
        depthLineKk: `${HAJJ_BOOK_SECTIONS.length} тарау · ${HAJJ_MUFTYAT_PAGES.length} бет · мәтін офлайн`,
        sections: HAJJ_BOOK_SECTIONS.length,
        pages: HAJJ_MUFTYAT_PAGES.length,
        offlineChars: HAJJ_BOOK_SECTIONS.reduce((s, x) => s + x.title.length, 0) + HAJJ_MUFTYAT_PAGES.length * 80,
      };
    case "tradition":
      return {
        moduleId,
        labelKk: "Дін мен ұрпақ",
        depthLineKk: `${TRADITION_TOPICS.length} тақырып · офлайн мәтін`,
        topics: TRADITION_TOPICS.length,
        offlineChars: TRADITION_TOPICS.reduce((s, t) => s + t.summary.length + t.title.length, 0),
      };
    case "duas": {
      const blocks = DUA_CATEGORIES.flatMap((c) => c.blocks);
      return {
        moduleId,
        labelKk: "Дұғалар",
        depthLineKk: `${DUA_CATEGORIES.length} санат · ${blocks.length} дұға · офлайн`,
        categories: DUA_CATEGORIES.length,
        items: blocks.length,
        offlineChars: blocks.reduce((s, b) => s + b.meaningKk.length + b.ar.length, 0),
      };
    }
    case "tasbih": {
      const items = loadDhikrItems();
      return {
        moduleId,
        labelKk: "Зікірлер",
        depthLineKk: `${items.length} зікір · офлайн`,
        items: items.length,
        offlineChars: items.reduce((s, d) => s + d.textKk.length + d.textAr.length, 0),
      };
    }
    case "asma": {
      const rows = loadAsmaRows();
      return {
        moduleId,
        labelKk: "Есмелер",
        depthLineKk: `${rows.length} есме · офлайн`,
        items: rows.length,
        offlineChars: rows.reduce((s, r) => s + r.kk.length + r.ar.length, 0),
      };
    }
    case "hadith": {
      const items = getKzTrustedHadithItems();
      return {
        moduleId,
        labelKk: "Хадис",
        depthLineKk: `${items.length} сахих хадис · офлайн`,
        items: items.length,
        offlineChars: items.reduce((s, h) => s + h.textKk.length + h.arabic.length, 0),
      };
    }
    default:
      return { moduleId, labelKk: moduleId, depthLineKk: "", offlineChars: 0 };
  }
}

export function getAllGuidanceDepthSnapshots(): ModuleDepthSnapshot[] {
  const ids: GuidanceModuleId[] = ["seerah", "hajj", "tradition", "duas", "tasbih", "asma", "hadith"];
  return ids.map(getModuleDepthSnapshot);
}

/** Тесттер үшін: барлық модульдер минимумға сәйкес келе ме */
export function assertGuidanceDepthParity(): void {
  const mins = GUIDANCE_DEPTH_MINIMUMS;

  expect(SEERAH_PHASES.length).toBeGreaterThanOrEqual(mins.seerah.phases);
  expect(SEERAH_LESSON_COUNT).toBe(SEERAH_LESSONS.length);
  expect(SEERAH_LESSONS.length).toBeGreaterThanOrEqual(mins.seerah.lessons);
  for (const l of SEERAH_LESSONS) {
    expect(l.summaryKk.trim().length).toBeGreaterThanOrEqual(mins.seerah.minSummaryChars);
  }
  expect(seerahOfflineCharCount()).toBeGreaterThanOrEqual(mins.seerah.offlineChars);

  expect(HAJJ_BOOK_SECTIONS.length).toBeGreaterThanOrEqual(mins.hajj.sections);
  expect(HAJJ_MUFTYAT_PAGES.length).toBeGreaterThanOrEqual(mins.hajj.pages);

  expect(TRADITION_TOPICS.length).toBeGreaterThanOrEqual(mins.tradition.topics);
  for (const t of TRADITION_TOPICS) {
    expect(t.summary.trim().length).toBeGreaterThanOrEqual(mins.tradition.minSummaryChars);
  }

  expect(DUA_CATEGORIES.length).toBeGreaterThanOrEqual(mins.duas.categories);
  expect(DUA_CATEGORIES.flatMap((c) => c.blocks).length).toBeGreaterThanOrEqual(mins.duas.minBlocks);

  expect(loadDhikrItems().length).toBeGreaterThanOrEqual(mins.tasbih.items);
  expect(loadAsmaRows().length).toBeGreaterThanOrEqual(mins.asma.names);
  expect(getKzTrustedHadithItems().length).toBeGreaterThanOrEqual(mins.hadith.items);
}
