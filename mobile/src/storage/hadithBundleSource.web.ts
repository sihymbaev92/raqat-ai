/**
 * Web: толық хадис корпусын JS бандлға кіргізбей, runtime fetch арқылы аламыз.
 * Егер generated full corpus deploy-да жоқ болса, tracked compact seed-ке fallback жасаймыз.
 */
import type { HadithCorpus } from "./hadithCorpus";
import { bundledJsonRemoteUrl } from "../config/bundledJsonBase";

let cache: HadithCorpus | null | undefined;

async function fetchCorpusAsset(fileName: string): Promise<HadithCorpus | null> {
  const r = await fetch(bundledJsonRemoteUrl(fileName), {
    cache: "force-cache",
  });
  if (!r.ok) return null;
  return (await r.json()) as HadithCorpus;
}

export async function loadBundledHadithCorpusJson(): Promise<HadithCorpus | null> {
  if (cache !== undefined) return cache;
  try {
    cache =
      (await fetchCorpusAsset("hadith-from-db.json")) ??
      (await fetchCorpusAsset("hadith-from-db-seed.json"));
    return cache ?? null;
  } catch {
    cache = null;
    return null;
  }
}
