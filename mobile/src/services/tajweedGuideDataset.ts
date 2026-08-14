import type {
  TajweedGuideDataset,
  TajweedGuideExampleAudio,
  TajweedGuideExampleRecord,
} from "../content/tajweedGuideDataset.types";

import bundled from "../../assets/bundled/tajweed-guide-dataset.json";

const DATASET = bundled as TajweedGuideDataset;

function normKey(ar: string): string {
  return (ar ?? "").trim().normalize("NFC");
}

export function tajweedGuideDataset(): TajweedGuideDataset {
  return DATASET;
}

export function tajweedGuideExampleRecord(arabic: string): TajweedGuideExampleRecord | undefined {
  const key = normKey(arabic);
  if (!key) return undefined;
  const direct = DATASET.examples[key];
  if (direct) return direct;
  for (const [k, rec] of Object.entries(DATASET.examples)) {
    if (k.normalize("NFC") === key) return rec;
  }
  return undefined;
}

export function tajweedGuideExampleReading(arabic: string): string | undefined {
  const rec = tajweedGuideExampleRecord(arabic);
  const reading = (rec?.readingKk ?? "").trim();
  return reading || undefined;
}

export function tajweedGuideExampleAudio(arabic: string): TajweedGuideExampleAudio | undefined {
  return tajweedGuideExampleRecord(arabic)?.audio;
}

export function isEveryAyahTajweedExampleAudio(
  audio: TajweedGuideExampleAudio | undefined
): audio is Extract<TajweedGuideExampleAudio, { source: "everyayah-word" }> {
  return audio?.source === "everyayah-word";
}
