import {
  TAJWEED_EXAMPLE_AUDIO_BY_AR,
  tajweedExampleAudioFile,
  tajweedExampleAudioSource,
  hasBundledTajweedExampleAudio,
} from "../tajweedExampleAudio";
import { TAJWEED_ALPHABET_ROWS } from "../tajweedAlphabet";
import { getTajweedAssetsBaseUrl } from "../../config/tajweedAssetsBase";
import fs from "fs";
import path from "path";

function extractManualArabicExamples(): string[] {
  const src = fs.readFileSync(path.join(process.cwd(), "src/content/tajweedManualBook.ts"), "utf8");
  const words = new Set<string>();
  const re = /arabic:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const ar = m[1].trim().normalize("NFC");
    if (ar && /[\u0600-\u06FF]/.test(ar)) words.add(ar);
  }
  return [...words];
}

describe("tajweedExampleAudio", () => {
  it("audio sources for all 28 alphabet example words (bundled or CDN)", () => {
    const examples = TAJWEED_ALPHABET_ROWS.flat().map((c) => c.example);
    expect(examples).toHaveLength(28);

    const base = getTajweedAssetsBaseUrl();
    for (const example of examples) {
      const file = tajweedExampleAudioFile(example);
      expect(file).toBeTruthy();
      const src = tajweedExampleAudioSource(example);
      expect(src).toEqual(expect.objectContaining({ uri: expect.any(String) }));
      const uri = (src as { uri: string }).uri;
      if (hasBundledTajweedExampleAudio(file!)) {
        expect(uri.length).toBeGreaterThan(0);
      } else {
        expect(uri).toMatch(
          new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/examples/.+\\.mp3$`)
        );
      }
    }
  });

  it("manifest covers all manual book arabic examples", () => {
    const manualExamples = extractManualArabicExamples();
    expect(manualExamples.length).toBeGreaterThan(20);
    for (const example of manualExamples) {
      expect(TAJWEED_EXAMPLE_AUDIO_BY_AR[example] ?? tajweedExampleAudioFile(example)).toBeTruthy();
      expect(tajweedExampleAudioSource(example)).toBeTruthy();
    }
  });
});
