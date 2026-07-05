import {
  htmlFontTajweedRuns,
  isHtmlFontTajweedText,
  stripHtmlFontTajweedTags,
} from "../htmlTajweedParse";

describe("htmlTajweedParse", () => {
  it("parses font color tags into inline runs", () => {
    const runs = htmlFontTajweedRuns(
      'بِسْمِ <font color="#009900">ٱ</font>للَّ<font color="#DD0000">هِ</font>'
    );
    expect(runs.length).toBeGreaterThanOrEqual(3);
    expect(runs.some((r) => r.color === "#009900")).toBe(true);
    expect(runs.some((r) => r.color === "#DD0000")).toBe(true);
  });

  it("strips font tags to plain arabic", () => {
    const plain = stripHtmlFontTajweedTags('<font color="red">ٱ</font>للَّ');
    expect(plain).not.toContain("<font");
    expect(plain).toContain("ٱ");
  });

  it("detects html font tajweed", () => {
    expect(isHtmlFontTajweedText('<font color="#000">x</font>')).toBe(true);
    expect(isHtmlFontTajweedText("[g[ٱ")).toBe(false);
  });
});
