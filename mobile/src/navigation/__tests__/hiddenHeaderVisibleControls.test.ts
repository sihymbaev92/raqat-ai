import fs from "fs";
import path from "path";

function source(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("hidden-header visible controls", () => {
  it("keeps Quran settings reachable from the settings hub", () => {
    const src = source("src/components/settings/SettingsHatimHub.tsx");

    expect(src).toContain('navigation.navigate("QuranSettings")');
  });

  it("keeps Hatim settings reachable from the settings hub", () => {
    const src = source("src/components/settings/SettingsHatimHub.tsx");

    expect(src).toContain("kk.hatim.settingsClearProgress");
    expect(src).toContain('navigation.navigate("QuranSettings")');
  });

  it("keeps Tajweed book back navigation visible without relying on headerLeft", () => {
    const src = source("src/screens/TajweedGuideScreen.tsx");

    expect(src).toContain("styles.bookHeader");
    expect(src).toContain("styles.bookBackButton");
    expect(src).toContain("goHome");
  });
});
