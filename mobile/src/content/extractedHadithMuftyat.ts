/** Fatua.kz + Muftyat.kz мақалаларынан автоматты бөлінген хадис/риуаят үзінділері. */
import bundled from "../../assets/bundled/extracted-hadith-muftyat.json";
import externalBundled from "../../assets/bundled/external-hadith-kk.json";
import type { ScrapedHadithMuftyatBundle, ScrapedHadithMuftyatItem } from "./scrapedHadithMuftyat";

export type ExtractedHadithMuftyatItem = ScrapedHadithMuftyatItem & {
  arabicText?: string;
  meaningKk?: string;
  sourceItemId?: string;
  sourceTitle?: string;
  sourceContext?: string;
};

export type ExtractedHadithMuftyatBundle = Omit<ScrapedHadithMuftyatBundle, "items"> & {
  items: ExtractedHadithMuftyatItem[];
};

const BUNDLE = bundled as ExtractedHadithMuftyatBundle;
const EXTERNAL_BUNDLE = externalBundled as ExtractedHadithMuftyatBundle;

export function getExtractedHadithMuftyatBundle(): ExtractedHadithMuftyatBundle {
  const baseItems = BUNDLE.items ?? [];
  const externalItems = EXTERNAL_BUNDLE.items ?? [];
  return {
    ...BUNDLE,
    itemCount: baseItems.length + externalItems.length,
    countsBySite: {
      ...(BUNDLE.countsBySite ?? {}),
      ...(EXTERNAL_BUNDLE.countsBySite ?? {}),
    },
    items: [...externalItems, ...baseItems],
  };
}

export function getExtractedHadithMuftyatItems(): ExtractedHadithMuftyatItem[] {
  return getExtractedHadithMuftyatBundle().items;
}

export function findExtractedHadithMuftyat(id: string): ExtractedHadithMuftyatItem | undefined {
  return getExtractedHadithMuftyatItems().find((item) => item.id === id);
}

export function extractedHadithSourceLabel(site?: string): string {
  if (site === "fatua") return "Fatua.kz · ҚМДБ";
  if (site === "muftyat") return "Muftyat.kz · ҚМДБ";
  if (site === "ummet") return "Ummet.kz";
  if (site === "muslim") return "Muslim.kz";
  if (site === "asyldin") return "Asyldin.kz";
  if (site === "islam") return "Islam.kz";
  return "Дереккөз";
}

export function extractedHadithOpenOriginalLabel(site?: string): string {
  if (site === "fatua") return "Fatua.kz-та толық мәтінді ашу";
  if (site === "muftyat") return "Muftyat.kz-та толық мақаланы ашу";
  if (site === "ummet") return "Ummet.kz-та деректі ашу";
  if (site === "muslim") return "Muslim.kz-та деректі ашу";
  if (site === "asyldin") return "Asyldin.kz-та деректі ашу";
  if (site === "islam") return "Islam.kz-та деректі ашу";
  return "Дереккөзді ашу";
}
