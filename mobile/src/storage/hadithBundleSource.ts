/**
 * Native / Jest: compact seed only. Full corpus — CDN + FileSystem cache.
 */
import type { HadithCorpus } from "./hadithCorpus";
import { tryLoadBundledJson } from "../utils/loadBundledJson";

export async function loadBundledHadithCorpusJson(): Promise<HadithCorpus | null> {
  if (process.env.NODE_ENV === "test") {
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
  return tryLoadBundledJson<HadithCorpus>("hadith-from-db-seed.json");
}
