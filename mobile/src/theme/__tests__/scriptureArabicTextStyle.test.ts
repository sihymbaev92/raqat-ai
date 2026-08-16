import { scriptureArabicTextStyle, scriptureArabicContainerStyle } from "../scriptureArabicTextStyle";

describe("scriptureArabicTextStyle", () => {
  it("defaults to RTL right-aligned stretch", () => {
    const style = scriptureArabicTextStyle();
    expect(style.writingDirection).toBe("rtl");
    expect(style.textAlign).toBe("right");
    expect(style.width).toBe("100%");
    expect(style.alignSelf).toBe("stretch");
  });

  it("supports centered single-glyph cells", () => {
    const style = scriptureArabicTextStyle({ align: "center" });
    expect(style.textAlign).toBe("center");
    expect(style.width).toBeUndefined();
  });

  it("container stretches full width", () => {
    expect(scriptureArabicContainerStyle()).toMatchObject({
      width: "100%",
      alignSelf: "stretch",
    });
  });
});
