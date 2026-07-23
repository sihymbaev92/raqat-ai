import {
  buildTajweedColoredBodyHtml,
  buildTajweedHtmlDocument,
  escapeTajweedHtml,
  resolveTajweedHtmlColorRuns,
} from "../tajweedHtmlDocument";

describe("tajweedHtmlDocument", () => {
  it("escapes HTML special chars", () => {
    expect(escapeTajweedHtml(`a<b>&"c`)).toBe("a&lt;b&gt;&amp;&quot;c");
  });

  it("keeps multi-color letter runs in one HTML flow (joined shaping)", () => {
    const runs = resolveTajweedHtmlColorRuns("[h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ", false, "#111");
    expect(runs.length).toBeGreaterThan(1);
    expect(runs.some((r) => r.color === "#AAAAAA")).toBe(true);
    expect(runs.some((r) => r.color === "#537FFF")).toBe(true);

    const body = buildTajweedColoredBodyHtml(runs);
    expect(body).toContain('style="color:#AAAAAA"');
    expect(body).toContain('style="color:#537FFF"');
    expect(body).not.toContain("[h");
    expect(body).toContain("رَّحْمَ");
  });

  it("builds rtl document with auto-height script", () => {
    const doc = buildTajweedHtmlDocument({
      bodyHtml: '<span style="color:#DD0008">ق</span>د',
      fontSize: 28,
      lineHeight: 48,
      ink: "#222",
    });
    expect(doc).toContain('dir="rtl"');
    expect(doc).toContain("ReactNativeWebView");
    expect(doc).toContain("font-size:28px");
    expect(doc).toContain("#DD0008");
  });

  it("resolves htmlFont markup without leaving raw font tags", () => {
    const runs = resolveTajweedHtmlColorRuns(
      'قَالُوا <font color="#FF7E1E">مِن</font> رَبِّهِمْ',
      false,
      "#111"
    );
    expect(runs.some((r) => r.color === "#FF7E1E" || r.color?.toLowerCase() === "#ff7e1e")).toBe(true);
    const body = buildTajweedColoredBodyHtml(runs);
    expect(body).not.toContain("<font");
    expect(body).toContain("مِن");
  });

  it("handles empty and plain untagged text", () => {
    expect(resolveTajweedHtmlColorRuns("", false, "#111")).toEqual([]);
    expect(resolveTajweedHtmlColorRuns("   ", false, "#111")).toEqual([]);
    expect(resolveTajweedHtmlColorRuns("بِسْمِ ٱللَّهِ", false, "#111")).toEqual([
      { text: "بِسْمِ ٱللَّهِ" },
    ]);
  });

  it("clamps tiny fontSize and keeps readable lineHeight", () => {
    const doc = buildTajweedHtmlDocument({
      bodyHtml: "ا",
      fontSize: 4,
      lineHeight: 2,
      ink: "#111",
    });
    expect(doc).toContain("font-size:12px");
    expect(doc).toMatch(/line-height:1[6-9]px|line-height:[2-9]\dpx/);
  });
});
