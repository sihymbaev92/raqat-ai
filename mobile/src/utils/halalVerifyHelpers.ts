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

export const HALAL_VISION_CLIENT_PROMPT = [
  "Соңында дәл екі жолды ғана шығар (өзге қосымша жол жоқ):",
  "BARCODE: <штрихкодтың тек сандары немесе NONE>",
  "NAME: <өнімнің қысқа атауы: қазақ/орыс/ағыл немесе NONE>",
  "Көрінбесе екеуіне де NONE жаз.",
].join("\n");

export const HALAL_VERIFY_DEBOUNCE_MS = 260;

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
  if (productTones.includes("bad")) {
    return {
      tone: "bad",
      title: kk.features.halalVerifySummaryBadTitle,
      body: kk.features.halalVerifySummaryBadBody,
      icon: "report-problem",
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
  if (additives.length > 0) {
    return {
      tone: "warn",
      title: kk.features.halalVerifySummaryAdditiveTitle,
      body: kk.features.halalVerifySummaryAdditiveBody(additives.length),
      icon: "science",
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
  const seed = mergeHalalProductItems(
    digits.length >= 8 ? lookupHalalProductsSeedByBarcode(digits) : [],
    searchHalalProductsSeed(digits || q, INSTANT_HALAL_SEARCH_LIMIT),
  );
  const s = status?.trim().toLowerCase();
  return s ? seed.filter((p) => (p.certificateStatus ?? "").toLowerCase() === s) : seed;
}
