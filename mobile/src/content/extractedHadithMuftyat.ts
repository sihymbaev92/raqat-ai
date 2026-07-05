/** Fatua.kz + Muftyat.kz мақалаларынан автоматты бөлінген хадис/риуаят үзінділері. */
import { tryLoadBundledJson } from "../utils/loadBundledJson";
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

const EMPTY_BUNDLE: ExtractedHadithMuftyatBundle = {
  version: 0,
  sourceOrg: "",
  licenseNote: "",
  itemCount: 0,
  items: [],
};

let bundleCache: ExtractedHadithMuftyatBundle | null = null;
let loadPromise: Promise<ExtractedHadithMuftyatBundle | null> | null = null;

async function loadExtractedBundle(): Promise<ExtractedHadithMuftyatBundle | null> {
  const [extracted, external] = await Promise.all([
    tryLoadBundledJson<ExtractedHadithMuftyatBundle>("extracted-hadith-muftyat.json"),
    tryLoadBundledJson<ExtractedHadithMuftyatBundle>("external-hadith-kk.json"),
  ]);
  const baseItems = extracted?.items ?? [];
  const externalItems = external?.items ?? [];
  if (!baseItems.length && !externalItems.length) return null;
  return {
    ...(extracted ?? external ?? EMPTY_BUNDLE),
    itemCount: baseItems.length + externalItems.length,
    countsBySite: {
      ...(extracted?.countsBySite ?? {}),
      ...(external?.countsBySite ?? {}),
    },
    items: [...externalItems, ...baseItems],
  };
}

export async function ensureExtractedHadithMuftyatLoaded(): Promise<ExtractedHadithMuftyatBundle | null> {
  if (bundleCache) return bundleCache;
  if (!loadPromise) {
    loadPromise = loadExtractedBundle()
      .then((data) => {
        if (data?.items?.length) bundleCache = data;
        return bundleCache;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function getExtractedHadithMuftyatBundle(): ExtractedHadithMuftyatBundle {
  return bundleCache ?? EMPTY_BUNDLE;
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
  if (site === "fatua") return "Fatua.kz-та ашу";
  if (site === "muftyat") return "Muftyat.kz-та ашу";
  return "Дереккөзде ашу";
}
