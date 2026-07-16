import {
  getDisplayEntriesByAuthorId,
  getEntryById,
  getMergedGreatWordsTopics,
  getReflectiveGreatWordsEntries,
  searchMergedGreatWordsTopics,
  ensureGreatWordsCatalogLoaded,
} from "../greatWordsCatalog";

describe("greatWordsCatalog", () => {
  beforeAll(async () => {
    await ensureGreatWordsCatalogLoaded();
  });
  it("merges repeated same-name topics into readable virtual entries", () => {
    const topics = getMergedGreatWordsTopics(20);
    const otan = topics.find((topic) => topic.title.toLowerCase() === "отан");

    expect(otan).toBeTruthy();
    expect(otan?.entries.length).toBeGreaterThan(10);
    expect(otan?.authorNames.length).toBeGreaterThan(1);

    const virtual = otan ? getEntryById(otan.id) : undefined;
    expect(virtual?.body).toContain("аттас тақырыптарды біріктірген жинақ");
    expect(virtual?.mergedCount).toBe(otan?.entries.length);
  });

  it("shows authors without repeating same title rows", () => {
    const rows = getDisplayEntriesByAuthorId("makhambet");
    const otanRows = rows.filter((entry) => entry.title.toLowerCase() === "отан");

    expect(otanRows).toHaveLength(1);
    expect(otanRows[0].mergedCount).toBeGreaterThan(1);
    expect(getEntryById(otanRows[0].id)?.body).toContain("Махамбет");
  });

  it("finds merged topics and long reflective writings", () => {
    const topicHits = searchMergedGreatWordsTopics("білім", 8);
    const writings = getReflectiveGreatWordsEntries(6);

    expect(topicHits.length).toBeGreaterThan(0);
    expect(writings.length).toBeGreaterThanOrEqual(4);
    expect(writings.every((entry) => entry.body.length >= 480)).toBe(true);
    expect(new Set(writings.map((entry) => entry.authorId)).size).toBeGreaterThan(1);
  });
});
