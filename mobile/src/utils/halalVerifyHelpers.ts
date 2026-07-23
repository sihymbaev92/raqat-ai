import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { HalalDamuAdditiveItem, HalalDamuCompanyCard, HalalDamuProductItem } from "../api/halalDamuWp";
import { kk } from "../i18n/kk";
import { halalCertTone } from "./halalCertDisplay";
import {
  lookupHalalProductsSeedByBarcode,
  mergeHalalProductItems,
  searchHalalProductsSeed,
} from "../services/halalProductsSeedKz";
import { INSTANT_HALAL_SEARCH_LIMIT } from "./halalInstantSearch";
import type { HalalFilterChip } from "../components/HalalFilterChipRow";

export const HALAL_VERIFY_DEBOUNCE_MS = 420;

export type HalalCheckSummaryTone = "ok" | "warn" | "bad" | "neutral";

export type HalalCheckSummary = {
  tone: HalalCheckSummaryTone;
  title: string;
  body: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

export function goodsProductStatusChips(): HalalFilterChip[] {
  return [
    { value: "", label: kk.features.halalFilterAll },
    { value: "halal", label: kk.features.halalProductStatusHalal },
    { value: "doubtful", label: kk.features.halalProductStatusDoubtful },
    { value: "haram", label: kk.features.halalProductStatusHaram },
  ];
}

export function buildHalalCheckSummary(
  products: HalalDamuProductItem[],
  additives: HalalDamuAdditiveItem[],
  companies: HalalDamuCompanyCard[],
): HalalCheckSummary | null {
  if (!products.length && !additives.length && !companies.length) return null;
  const productTones = products.map((p) => halalCertTone(p.certificateStatus));
  const additiveRisks = additives.map((a) => (a.risk || "").toUpperCase());
  const hasHaramAdditive = additiveRisks.includes("HARAM");
  const hasMushkilAdditive = additiveRisks.includes("MUSHKIL");

  if (productTones.includes("bad") || hasHaramAdditive) {
    return {
      tone: "bad",
      title: hasHaramAdditive
        ? kk.features.halalVerifySummaryHaramAdditiveTitle
        : kk.features.halalVerifySummaryBadTitle,
      body: hasHaramAdditive
        ? kk.features.halalVerifySummaryHaramAdditiveBody(
            additives.filter((a) => (a.risk || "").toUpperCase() === "HARAM").length,
          )
        : kk.features.halalVerifySummaryBadBody,
      icon: "report-problem",
    };
  }
  if (productTones.includes("ok") && !hasMushkilAdditive) {
    return {
      tone: "ok",
      title: kk.features.halalVerifySummaryOkTitle,
      body: kk.features.halalVerifySummaryOkBody(products.length),
      icon: "verified",
    };
  }
  if (additives.length > 0) {
    return {
      tone: "warn",
      title: hasMushkilAdditive
        ? kk.features.halalVerifySummaryMushkilAdditiveTitle
        : kk.features.halalVerifySummaryAdditiveTitle,
      body: hasMushkilAdditive
        ? kk.features.halalVerifySummaryMushkilAdditiveBody(
            additives.filter((a) => (a.risk || "").toUpperCase() === "MUSHKIL").length,
          )
        : kk.features.halalVerifySummaryAdditiveBody(additives.length),
      icon: "science",
    };
  }
  if (productTones.includes("ok")) {
    return {
      tone: "ok",
      title: kk.features.halalVerifySummaryOkTitle,
      body: kk.features.halalVerifySummaryOkBody(products.length),
      icon: "verified",
    };
  }
  if (companies.length > 0) {
    return {
      tone: "neutral",
      title: kk.features.halalVerifySummaryCompanyTitle,
      body: kk.features.halalVerifySummaryCompanyBody(companies.length),
      icon: "store",
    };
  }
  return null;
}

export function fastSeedProductsForQuery(query: string, status?: string): HalalDamuProductItem[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  const barcodeHits = digits.length >= 4 ? lookupHalalProductsSeedByBarcode(digits) : [];
  const textHits =
    digits.length >= 4 && digits.length === q.replace(/\s/g, "").length
      ? []
      : searchHalalProductsSeed(digits || q, INSTANT_HALAL_SEARCH_LIMIT);
  const seed = mergeHalalProductItems(barcodeHits, textHits);
  const s = status?.trim().toLowerCase();
  if (!s) return seed;
  return seed.filter(
    (p) =>
      p.fromRaqatSeed === true ||
      p.verificationStatus === "raqat_reference" ||
      (p.certificateStatus ?? "").toLowerCase() === s
  );
}
