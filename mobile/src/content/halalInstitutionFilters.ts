/** halaldamu.kz `category_type` — API мәні + UI чиптері. */
export const HALAL_INSTITUTION_CATEGORY_TYPES = [
  "food",
  "other",
  "catering",
  "production",
] as const;

export type HalalInstitutionCategoryType = (typeof HALAL_INSTITUTION_CATEGORY_TYPES)[number];

/** halaldamu.kz `certificate_status` — API мәні. */
export const HALAL_INSTITUTION_CERT_STATUSES = ["active", "expired", "draft"] as const;

export type HalalInstitutionCertStatus = (typeof HALAL_INSTITUTION_CERT_STATUSES)[number];
