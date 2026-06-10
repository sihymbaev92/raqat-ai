import { getDailyAyahRef } from "../data/quranAyahCounts";
import { hadithTextForLocale, loadHadithCorpus, type SahihHadithEntry } from "../storage/hadithCorpus";
import { pickSpiritLift, type SpiritLiftQuote } from "../content/spiritLift";

export type DailyAyahCard = { surah: number; ayah: number };

export function getDailyAyahCard(now = new Date()): DailyAyahCard {
  return getDailyAyahRef(now);
}

function dayIndex(now = new Date()): number {
  return Math.floor(now.getTime() / 86400000);
}

export async function getDailyHadithSnippet(
  locale: "kk" | "ru" | "en" = "kk"
): Promise<{ id: string; text: string; label: string } | null> {
  const corpus = await loadHadithCorpus();
  const list = corpus?.hadiths;
  if (!list?.length) return null;
  const entry = list[dayIndex() % list.length]! as SahihHadithEntry;
  const text = hadithTextForLocale(entry, locale);
  if (!text) return null;
  const trimmed = text.length > 220 ? `${text.slice(0, 217)}…` : text;
  const label = entry.collection?.trim() || entry.id;
  return { id: entry.id, text: trimmed, label };
}

export function getDailySpiritQuote(): SpiritLiftQuote {
  return pickSpiritLift();
}
