import fs from "fs";
import path from "path";

function source(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("hidden-header visible controls", () => {
  it("keeps Quran settings reachable from the Quran list body", () => {
    const src = source("src/screens/QuranListScreen.tsx");

    expect(src).toContain("styles.quranSettingsButton");
    expect(src).toContain("openQuranSettings");
    expect(src).toContain("kk.settings.headerQuranSettingsA11y");
  });

  it("keeps Hatim settings reachable from visible quick actions", () => {
    const src = source("src/screens/HatimScreen.tsx");

    expect(src).toContain("styles.hatimQuickActionSettings");
    expect(src).toContain("openHatimSettings");
    expect(src).toContain("kk.hatim.settingsBtnA11y");
  });

  it("keeps Tajweed book back navigation visible without relying on headerLeft", () => {
    const src = source("src/screens/TajweedGuideScreen.tsx");

    expect(src).toContain("styles.bookHeader");
    expect(src).toContain("styles.bookBackButton");
    expect(src).toContain("goHome");
  });
});
