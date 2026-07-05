/** Сенімді қазақ діни сайттар — тек сілтеме, мәтін көшірмейміз. */
export type HadithTrustedSourceId = "islam" | "muslim";

export type HadithTrustedSourceDef = {
  id: HadithTrustedSourceId;
  nameKk: string;
  homeUrl: string;
  usageKey: "sourceIslamUsage" | "sourceMuslimUsage";
  reliabilityKey: "reliabilityVeryHigh" | "reliabilityHigh";
};

export const HADITH_TRUSTED_SOURCES: HadithTrustedSourceDef[] = [
  {
    id: "islam",
    nameKk: "Islam.kz",
    homeUrl: "https://islam.kz/kk/",
    usageKey: "sourceIslamUsage",
    reliabilityKey: "reliabilityVeryHigh",
  },
  {
    id: "muslim",
    nameKk: "Muslim.kz",
    homeUrl: "https://muslim.kz/kk/",
    usageKey: "sourceMuslimUsage",
    reliabilityKey: "reliabilityHigh",
  },
];
