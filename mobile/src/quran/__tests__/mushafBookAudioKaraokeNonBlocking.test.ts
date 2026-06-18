import fs from "fs";
import path from "path";

describe("QuranMushafBookScreen audio karaoke startup", () => {
  it("does not block audio start on cache download or Quran.com metadata", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/screens/QuranMushafBookScreen.tsx"), "utf8");

    expect(src).toContain("resolveCachedOrRemoteQuranAudioUri");
    expect(src).toContain("void fetchQuranComAyahAudioSegments");
    expect(src).not.toContain("await fetchQuranComAyahAudioSegments");
  });
});
