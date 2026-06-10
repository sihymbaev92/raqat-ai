import { mosqueDetailForId, mosqueDetailForMosque } from "../mosqueDetailsEnrichment";

describe("mosqueDetailsEnrichment", () => {
  it("marks enriched mosque details with source confidence", () => {
    const ordabasy = mosqueDetailForId("70000001026474066");

    expect(ordabasy?.imamName).toBeTruthy();
    expect(ordabasy?.confidence).toBe("partial");
    expect(ordabasy?.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ordabasy?.sources.length).toBeGreaterThan(0);
  });

  it("keeps map-only records explicit when imam and phone are not verified", () => {
    const alBiruni = mosqueDetailForId("70000001028336683");

    expect(alBiruni?.confidence).toBe("map_only");
    expect(alBiruni?.imamName).toBeUndefined();
    expect(alBiruni?.phone).toBeUndefined();
  });

  it("covers high-visibility city mosques with explicit verification status", () => {
    for (const id of ["70000001018105093", "70000001033020386", "70000001035238965"]) {
      const detail = mosqueDetailForId(id);
      expect(detail?.confidence).toBeTruthy();
      expect(detail?.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(detail?.sources.length).toBeGreaterThan(0);
    }
  });

  it("keeps at least one official-source mosque as verified", () => {
    const hazretSultan = mosqueDetailForId("70000001018105093");

    expect(hazretSultan?.confidence).toBe("verified");
    expect(hazretSultan?.sources.some((s) => s.url.includes("akorda.kz"))).toBe(true);
  });

  it("returns a map-only fallback for every catalog mosque without enrichment", () => {
    const detail = mosqueDetailForMosque({
      id: "missing-2gis-id",
      name: "Тест мешіті",
      address: "Абай көшесі, 1",
      regionName: "Алматы",
      mapUrl: "https://2gis.kz/firm/missing-2gis-id",
    });

    expect(detail.confidence).toBe("map_only");
    expect(detail.info).toContain("Имам аты");
    expect(detail.sources[0]?.url).toContain("2gis.kz");
  });

  it("promotes catalog contact fallback to partial detail", () => {
    const detail = mosqueDetailForMosque({
      id: "missing-contact-2gis-id",
      name: "Байланысы бар мешіт",
      address: "Тәуелсіздік даңғылы, 1",
      regionName: "Астана",
      mapUrl: "https://2gis.kz/firm/missing-contact-2gis-id",
      contactPhones: ["+7 (700) 000-00-00"],
      websites: ["https://example.kz"],
      scheduleText: "09:00-18:00",
    });

    expect(detail.confidence).toBe("partial");
    expect(detail.phone).toBe("+7 (700) 000-00-00");
    expect(detail.website).toBe("https://example.kz");
    expect(detail.scheduleText).toBe("09:00-18:00");
    expect(detail.sources.map((s) => s.url)).toContain("https://example.kz");
  });
});
