import { kk } from "../i18n/kk";
import { HALAL_INSTITUTION_CATEGORY_TYPES, type HalalInstitutionCategoryType } from "../content/halalInstitutionFilters";
import type { HalalFilterChip } from "../components/HalalFilterChipRow";

export function labelForHalalInstitutionCategory(type: string | null | undefined): string {
  const t = (type ?? "").trim().toLowerCase();
  switch (t as HalalInstitutionCategoryType | "") {
    case "food":
      return kk.features.halalCategoryFood;
    case "catering":
      return kk.features.halalCategoryCatering;
    case "production":
      return kk.features.halalCategoryProduction;
    case "other":
      return kk.features.halalCategoryOther;
    default:
      return type?.trim() ? type.trim() : kk.features.halalCategoryOther;
  }
}

export function halalInstitutionCategoryFilterChips(): HalalFilterChip[] {
  return [
    { value: "", label: kk.features.halalFilterAll },
    ...HALAL_INSTITUTION_CATEGORY_TYPES.map((value) => ({
      value,
      label: labelForHalalInstitutionCategory(value),
    })),
  ];
}
