/**
 * Native / Jest: толық хадис корпусы (hadith-from-db.json) — Metro бандлдан.
 * Web нұсқасы (hadithBundleSource.web.ts) — runtime fetch (бандлды ~52 МБ-қа жеңілдетеді).
 */
import type { HadithCorpus } from "./hadithCorpus";

export async function loadBundledHadithCorpusJson(): Promise<HadithCorpus | null> {
  try {
    const mod = await import("../../assets/bundled/hadith-from-db.json");
    const m = mod as { default?: HadithCorpus };
    return m.default ?? (mod as unknown as HadithCorpus);
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/hadith-from-db.json") as HadithCorpus;
    } catch {
      return null;
    }
  }
}
