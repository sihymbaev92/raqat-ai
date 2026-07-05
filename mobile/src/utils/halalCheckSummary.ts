import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { HalalDamuAdditiveItem, HalalDamuCompanyCard, HalalDamuProductItem } from "../api/halalDamuWp";
import { kk } from "../i18n/kk";
import { halalCertTone } from "./halalCertDisplay";

export type HalalCheckSummaryTone = "ok" | "warn" | "bad" | "neutral";

export type HalalCheckSummary = {
  tone: HalalCheckSummaryTone;
  title: string;
  body: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

export function buildHalalCheckSummary(
  products: HalalDamuProductItem[],
  additives: HalalDamuAdditiveItem[],
  companies: HalalDamuCompanyCard[]
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
