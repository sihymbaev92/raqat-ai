/**
 * Араб мысал → қазақ транскрипция.
 * Дыбыс: arabic-online.ru харакат клиптері буын-бuyn (generate-tajweed-example-audio.py).
 * Мәтін: generate-tajweed-example-audio.py → TAJWEED_EXAMPLE_READING_MANIFEST (дыбыспен бірге).
 */

import { TAJWEED_EXAMPLE_READING_MANIFEST } from "../content/tajweedExampleReadingManifest.generated";
import { tajweedGuideExampleReading } from "../services/tajweedGuideDataset";

export type HarakatKind = "fatha" | "kesra" | "damma" | "saken";

const HARAKAT_RE = /[\u064B-\u0652\u0670]/;
const MARK = /\p{M}/u;

/** MP3 клиптерімен бірдей кластерлер (Python segment_clusters). */
export function segmentHarakatClusters(text: string): string[] {
  const normalized = (text ?? "").normalize("NFC").trim();
  const out: string[] = [];
  let i = 0;
  while (i < normalized.length) {
    const ch = normalized[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "،" || ch === "," || ch === ".") {
      i += 1;
      continue;
    }
    let cluster = ch;
    i += 1;
    while (i < normalized.length && MARK.test(normalized[i])) {
      cluster += normalized[i];
      i += 1;
    }
    out.push(cluster);
  }
  return out;
}

export function harakatKind(cluster: string): HarakatKind {
  if (cluster.includes("\u0652")) return "saken";
  if (cluster.includes("\u064E") || cluster.includes("\u064B")) return "fatha";
  if (cluster.includes("\u0650") || cluster.includes("\u064D")) return "kesra";
  if (cluster.includes("\u064F") || cluster.includes("\u064C")) return "damma";
  if (cluster.includes("\u0651")) return "fatha";
  return "fatha";
}

const VOWEL_CARRIERS = new Set(["ا", "آ", "ٱ", "ى", "أ", "إ", "ء", "ؤ", "ئ"]);

/** Буын → қазақ (клиптің дыбысын білдіреді). */
const SYLLABLE_KK: Record<string, Partial<Record<HarakatKind, string>>> = {
  ا: { fatha: "а", kesra: "и", damma: "у", saken: "" },
  آ: { fatha: "аа", kesra: "аа", damma: "аа", saken: "" },
  أ: { fatha: "а", kesra: "и", damma: "у", saken: "" },
  إ: { fatha: "и", kesra: "и", damma: "и", saken: "" },
  ء: { fatha: "а", kesra: "и", damma: "у", saken: "" },
  ؤ: { fatha: "у", kesra: "уи", damma: "у", saken: "у" },
  ئ: { fatha: "йа", kesra: "йи", damma: "йу", saken: "й" },
  ب: { fatha: "ба", kesra: "би", damma: "бу", saken: "б" },
  ت: { fatha: "та", kesra: "ти", damma: "ту", saken: "т" },
  ث: { fatha: "са", kesra: "си", damma: "су", saken: "с" },
  ج: { fatha: "жа", kesra: "жи", damma: "жу", saken: "ж" },
  ح: { fatha: "ха", kesra: "хи", damma: "ху", saken: "х" },
  خ: { fatha: "ха", kesra: "хи", damma: "ху", saken: "х" },
  د: { fatha: "да", kesra: "ди", damma: "ду", saken: "д" },
  ذ: { fatha: "за", kesra: "зи", damma: "зу", saken: "з" },
  ر: { fatha: "ра", kesra: "ри", damma: "ру", saken: "р" },
  ز: { fatha: "за", kesra: "зи", damma: "зу", saken: "з" },
  س: { fatha: "са", kesra: "си", damma: "су", saken: "с" },
  ش: { fatha: "ша", kesra: "ши", damma: "шу", saken: "ш" },
  ص: { fatha: "са", kesra: "си", damma: "су", saken: "с" },
  ض: { fatha: "да", kesra: "ди", damma: "ду", saken: "д" },
  ط: { fatha: "та", kesra: "ти", damma: "ту", saken: "т" },
  ظ: { fatha: "за", kesra: "зи", damma: "зу", saken: "з" },
  ع: { fatha: "‘а", kesra: "‘и", damma: "‘у", saken: "‘" },
  غ: { fatha: "ға", kesra: "ғи", damma: "ғу", saken: "ғ" },
  ف: { fatha: "фа", kesra: "фи", damma: "фу", saken: "ф" },
  ق: { fatha: "қа", kesra: "қи", damma: "қу", saken: "қ" },
  ك: { fatha: "ка", kesra: "ки", damma: "ку", saken: "к" },
  ل: { fatha: "ла", kesra: "ли", damma: "лу", saken: "л" },
  م: { fatha: "ма", kesra: "ми", damma: "му", saken: "м" },
  ن: { fatha: "на", kesra: "ни", damma: "ну", saken: "н" },
  ه: { fatha: "һа", kesra: "һи", damma: "һу", saken: "һ" },
  ة: { fatha: "та", kesra: "ти", damma: "ту", saken: "т" },
  و: { fatha: "уа", kesra: "уи", damma: "у", saken: "у" },
  ي: { fatha: "йа", kesra: "йи", damma: "йу", saken: "й" },
  ى: { fatha: "а", kesra: "и", damma: "у", saken: "" },
};

function syllableLabel(cluster: string): string {
  const base = cluster[0];
  const kind = harakatKind(cluster);
  const row = SYLLABLE_KK[base];
  if (row?.[kind] !== undefined) return row[kind] ?? "";

  if (VOWEL_CARRIERS.has(base)) {
    if (base === "آ") return "аа";
    if (base === "إ") return kind === "kesra" ? "и" : kind === "damma" ? "у" : "и";
    if (kind === "fatha") return "а";
    if (kind === "kesra") return "и";
    if (kind === "damma") return "у";
    return "";
  }

  return "";
}

/** Буындар тізімі — MP3 клип ретімен (shadda = екі рет). */
export function transliterateTajweedHarakatSyllables(arabic: string): string[] {
  const text = (arabic ?? "").trim();
  if (!text || !hasTajweedHarakat(text)) return [];

  const out: string[] = [];
  for (const cluster of segmentHarakatClusters(text)) {
    const label = syllableLabel(cluster);
    out.push(label);
    if (cluster.includes("\u0651")) {
      out.push(label);
    }
  }
  return out;
}

export const TAJWEED_SYLLABLE_SEP = "·";

/** Буындарды бөлгішпен — дыбысты буын-бuyn қадамда оқуға ыңғайлы. */
export function formatTajweedHarakatReading(arabic: string, sep = TAJWEED_SYLLABLE_SEP): string {
  const syllables = transliterateTajweedHarakatSyllables(arabic);
  if (!syllables.length) return "";
  return syllables.join(sep);
}

/** Біріктірілген (қысқа) нұсқа. */
export function transliterateTajweedHarakatExample(arabic: string): string {
  return transliterateTajweedHarakatSyllables(arabic).join("");
}

export function hasTajweedHarakat(arabic: string): boolean {
  return HARAKAT_RE.test((arabic ?? "").normalize("NFC"));
}

/** Харакатты мысал — JSON dataset → оқулық reading → manifest → auto. */
export function resolveTajweedExampleReading(arabic?: string, manual?: string): string {
  const ar = (arabic ?? "").trim();
  const manualTrim = (manual ?? "").trim();
  if (!ar) return manualTrim;
  if (manualTrim) return manualTrim;

  const datasetReading = tajweedGuideExampleReading(ar);
  if (datasetReading) return datasetReading;

  const manifestReading = lookupExampleReadingManifest(ar);
  if (manifestReading) return manifestReading;

  if (!hasTajweedHarakat(ar)) return "";
  const formatted = formatTajweedHarakatReading(ar);
  return formatted || "";
}

function lookupExampleReadingManifest(arabic: string): string | undefined {
  const key = arabic.normalize("NFC");
  const direct = TAJWEED_EXAMPLE_READING_MANIFEST[key];
  if (direct) return direct;
  for (const [manifestKey, reading] of Object.entries(TAJWEED_EXAMPLE_READING_MANIFEST)) {
    if (manifestKey.normalize("NFC") === key) return reading;
  }
  return undefined;
}
