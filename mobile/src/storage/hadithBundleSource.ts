/**
 * Native / Jest: compact seed only. The full corpus is a generated/runtime asset
 * so Metro and Android release bundles do not carry a 50MB+ JSON file.
 * Web нұсқасы (hadithBundleSource.web.ts) — runtime fetch.
 */
import type { HadithCorpus } from "./hadithCorpus";

export async function loadBundledHadithCorpusJson(): Promise<HadithCorpus | null> {
  try {
    const mod = await import("../../assets/bundled/hadith-from-db-seed.json");
    const m = mod as unknown as { default?: HadithCorpus };
    return m.default ?? (mod as unknown as HadithCorpus);
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/hadith-from-db-seed.json") as HadithCorpus;
    } catch {
      return null;
    }
  }
}
