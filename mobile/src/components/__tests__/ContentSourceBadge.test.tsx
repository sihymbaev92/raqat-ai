import { DEFAULT_LABELS } from "../ContentSourceBadge";

describe("ContentSourceBadge labels", () => {
  it("defines muftiyat and fatua separately", () => {
    expect(DEFAULT_LABELS.muftiyat).toContain("Muftyat");
    expect(DEFAULT_LABELS.fatua).toContain("Fatua");
  });

  it("defines official and quran sources", () => {
    expect(DEFAULT_LABELS.official).toContain("Ресми");
    expect(DEFAULT_LABELS.quran).toContain("Құран");
  });
});
