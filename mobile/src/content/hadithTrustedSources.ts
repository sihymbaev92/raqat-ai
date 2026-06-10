/** Сенімді қазақ діни басқарма / ресми сайттар — хадис іздеу (сілтеме ғана, мәтін көшірмейміз). */
export type HadithTrustedSourceId = "muftyat" | "islam" | "fatua" | "muslim";

export type HadithTrustedSourceDef = {
  id: HadithTrustedSourceId;
  nameKk: string;
  homeUrl: string;
  /** kk.hadith.hub.source*Usage кілті */
  usageKey:
    | "sourceMuftyatUsage"
    | "sourceIslamUsage"
    | "sourceFatuaUsage"
    | "sourceMuslimUsage";
  reliabilityKey: "reliabilityVeryHigh" | "reliabilityHigh";
};

export const HADITH_TRUSTED_SOURCES: HadithTrustedSourceDef[] = [
  {
    id: "muftyat",
    nameKk: "Muftyat.kz",
    homeUrl: "https://www.muftyat.kz/kk/",
    usageKey: "sourceMuftyatUsage",
    reliabilityKey: "reliabilityVeryHigh",
  },
  {
    id: "islam",
    nameKk: "Islam.kz",
    homeUrl: "https://islam.kz/kk/",
    usageKey: "sourceIslamUsage",
    reliabilityKey: "reliabilityVeryHigh",
  },
  {
    id: "fatua",
    nameKk: "Fatua.kz",
    homeUrl: "https://fatua.kz/kk/",
    usageKey: "sourceFatuaUsage",
    reliabilityKey: "reliabilityHigh",
  },
  {
    id: "muslim",
    nameKk: "Muslim.kz",
    homeUrl: "https://muslim.kz/kk/",
    usageKey: "sourceMuslimUsage",
    reliabilityKey: "reliabilityHigh",
  },
];
