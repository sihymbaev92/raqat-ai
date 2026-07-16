import { TAJWEED_LETTER_AUDIO_BY_AR, tajweedLetterAudioSource } from "../tajweedLetterAudio";
import { TAJWEED_ALPHABET_ROWS } from "../tajweedAlphabet";
import { getTajweedAssetsBaseUrl } from "../../config/tajweedAssetsBase";

describe("tajweedLetterAudio", () => {
  it("CDN audio URIs for all 28 alphabet letters", () => {
    const letters = TAJWEED_ALPHABET_ROWS.flat().map((c) => c.ar);
    expect(letters).toHaveLength(28);
    expect(Object.keys(TAJWEED_LETTER_AUDIO_BY_AR)).toHaveLength(28);
    const base = getTajweedAssetsBaseUrl();
    for (const ar of letters) {
      const src = tajweedLetterAudioSource(ar);
      expect(src).toEqual(
        expect.objectContaining({
          uri: expect.stringMatching(new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/letters/.+\\.mp3$`)),
        })
      );
    }
  });
});
