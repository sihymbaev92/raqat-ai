import { quranAudioCacheFileNameForUrl } from "../quranAudioCache";

describe("quranAudioCacheFileNameForUrl", () => {
  it("uses a stable mp3 filename per remote audio URL", () => {
    const url = "https://cdn.islamic.network/quran/audio/192/ar.abdurrahmaansudais/1.mp3";

    expect(quranAudioCacheFileNameForUrl(url)).toBe(quranAudioCacheFileNameForUrl(url));
    expect(quranAudioCacheFileNameForUrl(url)).toMatch(/^[a-z0-9]+\.mp3$/);
  });

  it("keeps different reciters or ayahs in different cache files", () => {
    const first = quranAudioCacheFileNameForUrl(
      "https://cdn.islamic.network/quran/audio/192/ar.abdurrahmaansudais/1.mp3"
    );
    const second = quranAudioCacheFileNameForUrl(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3"
    );
    const third = quranAudioCacheFileNameForUrl(
      "https://cdn.islamic.network/quran/audio/192/ar.abdurrahmaansudais/2.mp3"
    );

    expect(new Set([first, second, third]).size).toBe(3);
  });
});
