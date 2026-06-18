import fs from "fs";
import path from "path";

describe("useAyahPlayback stale request guard", () => {
  it("cancels stale in-flight audio loads before they can play", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/quran/useAyahPlayback.ts"), "utf8");

    expect(src).toContain("ayahPlayRequestSeqRef");
    expect(src).toContain("ayahPlayRequestSeqRef.current !== requestSeq");
    expect(src).toContain("await sound.unloadAsync()");
  });

  it("does not block audio start on cache download or Quran.com karaoke metadata", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/quran/useAyahPlayback.ts"), "utf8");

    expect(src).toContain("resolveCachedOrRemoteQuranAudioUri");
    expect(src).toContain("void fetchQuranComAyahAudioSegments");
    expect(src).not.toContain("await fetchQuranComAyahAudioSegments");
  });
});
