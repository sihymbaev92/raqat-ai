/**
 * Web: толық хадис корпусын (~52 МБ) JS бандлға кіргізбей, runtime fetch арқылы аламыз
 * (nginx /assets/bundled/hadith-from-db.json — copy-web-bundled-json.js көшіреді).
 */
import type { HadithCorpus } from "./hadithCorpus";
import { bundledJsonRemoteUrl } from "../config/bundledJsonBase";

let cache: HadithCorpus | null | undefined;

export async function loadBundledHadithCorpusJson(): Promise<HadithCorpus | null> {
  if (cache !== undefined) return cache;
  try {
    const r = await fetch(bundledJsonRemoteUrl("hadith-from-db.json"), {
      cache: "force-cache",
    });
    if (!r.ok) {
      cache = null;
      return null;
    }
    cache = (await r.json()) as HadithCorpus;
    return cache ?? null;
  } catch {
    cache = null;
    return null;
  }
}
