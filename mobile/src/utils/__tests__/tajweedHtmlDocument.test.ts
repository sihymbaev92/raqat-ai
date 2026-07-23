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
});
