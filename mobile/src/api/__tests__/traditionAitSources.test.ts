import {
  extractAitSnippetsFromPlainText,
  htmlToPlainText,
  countAitSnippets,
  traditionAitSourceUrls,
} from "../traditionAitSources";

jest.mock("../../config/raqatMarketingWebUrl", () => ({
  getRaqatMarketingWebUrl: () => "https://raqat.ai",
}));

jest.mock("../halalDamuWp", () => ({
  halalDamuSiteHomeUrl: () => "https://halaldamu.kz/",
}));

describe("htmlToPlainText", () => {
  it("strips tags and decodes entities", () => {
    const html = "<p>Айт <strong>құтты</strong> &amp; мереке</p>";
    expect(htmlToPlainText(html)).toContain("Айт");
    expect(htmlToPlainText(html)).not.toContain("<");
  });
});

describe("extractAitSnippetsFromPlainText", () => {
  it("keeps sentences matching ait keywords", () => {
    const plain =
      "Бұл жалпы мәтін. Ораза айт намазы жамағатпен оқылады. Кейбір сөздер қысқа. Құрбан айт мерекесінде көрісу дәстүрі.";
    const snippets = extractAitSnippetsFromPlainText(plain);
    expect(snippets.length).toBeGreaterThanOrEqual(2);
    expect(snippets.some((s) => /айт/i.test(s))).toBe(true);
  });

  it("returns empty when no keywords", () => {
    expect(extractAitSnippetsFromPlainText("Жалпы халал стандарттар туралы хабарлама.")).toEqual([]);
  });
});

describe("traditionAitSourceUrls", () => {
  it("includes default raqat marketing web", () => {
    const urls = traditionAitSourceUrls();
    expect(urls.halaldamu).toContain("halaldamu.kz");
    expect(urls.raqat).toBe("https://raqat.ai");
  });
});

describe("countAitSnippets", () => {
  it("sums snippet counts", () => {
    expect(
      countAitSnippets({
        sources: [
          { id: "halaldamu", label: "h", url: "u", ok: true, snippets: ["a", "b"] },
          { id: "raqat", label: "r", url: "", ok: false, snippets: [] },
        ],
        syncedAt: null,
        fromCache: false,
      })
    ).toBe(2);
  });
});
