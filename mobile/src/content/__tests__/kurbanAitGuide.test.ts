import { kk } from "../../i18n/kk";
import {
  KURBAN_AIT_DASHBOARD_HERO,
  KURBAN_AIT_GUIDE_INFOGRAPHIC,
  KURBAN_AIT_IMAGE_ASPECT,
  getKurbanAitBlock,
} from "../kurbanAitBlockContent";
import { getKurbanAitDashboardTopics } from "../kurbanAitDashboardTopics";
import {
  KURBAN_AIT_DAY_PLAN,
  KURBAN_AIT_GUIDE_EPIGRAPH,
  KURBAN_AIT_GUIDE_SEARCH_TEXT,
  KURBAN_AIT_GUIDE_SECTIONS,
  KURBAN_AIT_KAZAKH_PHRASES,
} from "../kurbanAitGuideContent";

const INFOGRAPHIC_SECTION_IDS = [
  "ait-namaz",
  "dua-greeting",
  "ait-visits",
  "qurban-sacrifice",
  "meat-sharing",
  "no-waste",
] as const;

const LEGACY_SECTION_IDS = ["worship", "qurban", "guest", "adab"];

describe("kurbanAitGuideContent", () => {
  it("has six infographic-aligned sections with unique ids", () => {
    expect(KURBAN_AIT_GUIDE_SECTIONS).toHaveLength(6);
    const ids = KURBAN_AIT_GUIDE_SECTIONS.map((s) => s.id);
    expect(ids).toEqual([...INFOGRAPHIC_SECTION_IDS]);
    expect(new Set(ids).size).toBe(6);
    for (const legacy of LEGACY_SECTION_IDS) {
      expect(ids).not.toContain(legacy);
    }
  });

  it("each section has lead and at least one bullet", () => {
    for (const s of KURBAN_AIT_GUIDE_SECTIONS) {
      expect(s.title.length).toBeGreaterThan(5);
      expect(s.lead?.length).toBeGreaterThan(10);
      expect(s.bullets.length).toBeGreaterThanOrEqual(1);
      for (const b of s.bullets) {
        expect(b.length).toBeGreaterThan(10);
      }
    }
  });

  it("section titles match the guide infographic panels", () => {
    const titles = KURBAN_AIT_GUIDE_SECTIONS.map((s) => s.title);
    expect(titles).toEqual([
      "Құрбан айт намазы",
      "Дұға жасау және құттықтау",
      "Көршілерге айттау",
      "Құрбандық шалу",
      "Құрбандық етін бөлу",
      "Ысырапсыз мереке",
    ]);
  });

  it("search index includes epigraph and all section titles", () => {
    expect(KURBAN_AIT_GUIDE_SEARCH_TEXT).toContain(KURBAN_AIT_GUIDE_EPIGRAPH);
    for (const s of KURBAN_AIT_GUIDE_SECTIONS) {
      expect(KURBAN_AIT_GUIDE_SEARCH_TEXT).toContain(s.title);
    }
  });

  it("has phrases and a three-day plan", () => {
    expect(KURBAN_AIT_KAZAKH_PHRASES.length).toBeGreaterThanOrEqual(4);
    expect(KURBAN_AIT_DAY_PLAN).toHaveLength(3);
    for (const day of KURBAN_AIT_DAY_PLAN) {
      expect(day.items.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("kurbanAitDashboardTopics", () => {
  it("maps six guide sections plus phrases and day plan", () => {
    const topics = getKurbanAitDashboardTopics();
    expect(topics).toHaveLength(8);
    expect(topics.slice(0, 6).map((t) => t.id)).toEqual([...INFOGRAPHIC_SECTION_IDS]);
    expect(topics[6]?.id).toBe("phrases");
    expect(topics[7]?.id).toBe("dayplan");
    for (const t of topics) {
      expect(t.title.length).toBeGreaterThan(3);
    }
  });

  it("section topics use guide lead as subtitle", () => {
    const topics = getKurbanAitDashboardTopics();
    for (let i = 0; i < 6; i++) {
      expect(topics[i]?.subtitle).toBe(KURBAN_AIT_GUIDE_SECTIONS[i]?.lead);
    }
  });
});

describe("kurbanAitBlockContent", () => {
  it("resolves dashboard and guide image assets", () => {
    expect(KURBAN_AIT_DASHBOARD_HERO).toBeTruthy();
    expect(KURBAN_AIT_GUIDE_INFOGRAPHIC).toBeTruthy();
    expect(KURBAN_AIT_DASHBOARD_HERO).not.toEqual(KURBAN_AIT_GUIDE_INFOGRAPHIC);
  });

  it("uses wide infographic aspect ratio", () => {
    expect(KURBAN_AIT_IMAGE_ASPECT).toBeCloseTo(1024 / 558, 5);
  });

  it("getKurbanAitBlock uses epigraph as summary", () => {
    const block = getKurbanAitBlock();
    expect(block.summary).toBe(KURBAN_AIT_GUIDE_EPIGRAPH);
    expect(block.practice.length).toBeGreaterThanOrEqual(15);
    expect(block.heroImage).toEqual(KURBAN_AIT_DASHBOARD_HERO);
  });
});

describe("kurbanAit i18n", () => {
  it("labels six-direction plan and accessible infographic", () => {
    const tg = kk.features.traditionGuide;
    expect(tg.kurbanAit.sectionsTitle).toContain("алты бағыт");
    expect(tg.kurbanAit.sectionsTitle).not.toContain("төрт бағыт");
    expect(tg.kurbanInfographicA11y).toMatch(/намаз/i);
    expect(tg.kurbanInfographicA11y).toMatch(/ысырапсыз/i);
    expect(kk.features.kurbanAitIntro.length).toBeGreaterThan(40);
    expect(kk.features.kurbanAitTopicSub).toMatch(/намаз/i);
  });
});
