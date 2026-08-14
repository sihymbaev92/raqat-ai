/** Tajweed guide example — bundled JSON (build-tajweed-guide-dataset.py). */

export type TajweedGuideAudioSource =
  | "harakat-clips"
  | "everyayah-word"
  | "bundled"
  | "cdn";

export type TajweedGuideExampleAudio =
  | {
      source: "harakat-clips" | "bundled" | "cdn";
      file: string;
    }
  | {
      source: "everyayah-word";
      surah: number;
      ayah: number;
      /** 0-based сөз индексі (Quran.com segments). */
      wordIndex: number;
      reciterEdition?: string;
    };

export type TajweedGuideExampleRecord = {
  arabic: string;
  readingKk: string;
  audio: TajweedGuideExampleAudio;
  /** Қайдан алынған (Muftyat, BBjamaat, …). */
  textSource?: string;
};

export type TajweedGuideDataset = {
  version: number;
  generatedAt: string;
  sources: {
    textbook: string;
    alphabetReference: string;
    tajweedRules: string;
    audioHarakatClips: string;
    audioQuran: string;
  };
  examples: Record<string, TajweedGuideExampleRecord>;
};
