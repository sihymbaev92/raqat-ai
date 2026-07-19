import type { AppLocale } from "../i18n/runtime";
import type { SahihHadithEntry } from "../storage/hadithCorpus";
import { hadithCollectionBucket } from "../storage/hadithCorpus";
import { kk } from "../i18n/kk";

/** Жинақ атауы — таңдалған UI тілінде (KK chrome leak жоқ). */
export function hadithCollectionDisplayName(
  h: Pick<SahihHadithEntry, "collection" | "collectionNameKk" | "id">,
  _locale: AppLocale
): string {
  const bucket = hadithCollectionBucket(h);
  if (bucket === "bukhari") return kk.hadith.collectionBukhari;
  if (bucket === "muslim") return kk.hadith.collectionMuslim;
  if ((h.collectionNameKk || "").trim() && _locale === "kk") return h.collectionNameKk.trim();
  return h.collection || "—";
}

export function hadithBookDisplayTitle(
  h: Pick<SahihHadithEntry, "bookTitleKk" | "catalogOrigin" | "kyUzSourceLabel">,
  locale: AppLocale
): string {
  if (h.catalogOrigin === "hadeethenc" || h.kyUzSourceLabel === "HadeethEnc.com") {
    return "HadeethEnc.com";
  }
  if (locale === "kk") return (h.bookTitleKk || "").trim();
  return "";
}

export function hadithSourceForLocale(
  entry: SahihHadithEntry | undefined,
  locale: AppLocale
): { label: string; citation: string } {
  if (!entry) {
    return { label: "", citation: "" };
  }
  const coll = hadithCollectionDisplayName(entry, locale);
  if (locale === "ky" || locale === "uz") {
    const enc = entry.hadeethEncId ? ` #${entry.hadeethEncId}` : "";
    return {
      label: entry.kyUzSourceLabel || "HadeethEnc.com",
      citation: `${(entry.kyUzSourceAttribution || "HadeethEnc.com").trim()}${enc}`,
    };
  }
  if (locale === "en") {
    return {
      label: "fawazahmed0/hadith-api (eng)",
      citation: `${coll}, № ${entry.reference}`,
    };
  }
  if (locale === "ru") {
    return {
      label: entry.hadeethEncId
        ? "fawazahmed0 / HadeethEnc.com"
        : "fawazahmed0/hadith-api (rus)",
      citation: `${coll}, № ${entry.reference}`,
    };
  }
  if (locale === "tr") {
    return {
      label: "fawazahmed0/hadith-api (tur)",
      citation: `${coll}, № ${entry.reference}`,
    };
  }
  if (locale === "ar") {
    return {
      label: coll,
      citation: `№ ${entry.reference}`,
    };
  }
  return {
    label: entry.kkSourceLabel?.trim() || entry.collectionNameKk || kk.hadith.kkSourceTitle,
    citation:
      entry.sourceCitationKk?.trim() ||
      `${entry.collectionNameKk}, хадис № ${entry.reference}`,
  };
}
