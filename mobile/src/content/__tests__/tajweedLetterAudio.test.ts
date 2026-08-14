import {
  TAJWEED_LETTER_AUDIO_BY_AR,
  tajweedLetterAudioSource,
  hasBundledTajweedLetterAudio,
  isBareTajweedAlphabetLetter,
} from "../tajweedLetterAudio";

import { TAJWEED_ALPHABET_ROWS } from "../tajweedAlphabet";

import { getTajweedAssetsBaseUrl } from "../../config/tajweedAssetsBase";



describe("tajweedLetterAudio", () => {

  it("audio sources for all 28 alphabet letters (bundled or CDN)", () => {

    const letters = TAJWEED_ALPHABET_ROWS.flat().map((c) => c.ar);

    expect(letters).toHaveLength(28);

    expect(Object.keys(TAJWEED_LETTER_AUDIO_BY_AR)).toHaveLength(28);

    const base = getTajweedAssetsBaseUrl();

    for (const ar of letters) {

      const file = TAJWEED_LETTER_AUDIO_BY_AR[ar];

      expect(file).toBeTruthy();

      const src = tajweedLetterAudioSource(ar);

      expect(src).toEqual(expect.objectContaining({ uri: expect.any(String) }));

      const uri = (src as { uri: string }).uri;

      if (hasBundledTajweedLetterAudio(file!)) {

        expect(uri.length).toBeGreaterThan(0);

      } else {

        expect(uri).toMatch(

          new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/letters/.+\\.mp3$`)

        );

      }

    }

  });

  it("detects bare alphabet letters for letter-name audio routing", () => {
    expect(isBareTajweedAlphabetLetter("ا")).toBe(true);
    expect(isBareTajweedAlphabetLetter("ب")).toBe(true);
    expect(isBareTajweedAlphabetLetter("أَدَبَ")).toBe(false);
    expect(isBareTajweedAlphabetLetter("أَنْ")).toBe(false);
  });
});

