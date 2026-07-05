/**
 * Хадис бөліміндегі контент түрлері — Muftyat/Fatua үзінді vs классикалық сахих корпус (P0).
 */

export type HadithContentTypeId = "articleExcerpt" | "sahihCorpus";

export type HadithContentTypeDef = {
  id: HadithContentTypeId;
  /** kk.hadith.contentTypes.* badge */
  badgeI18nKey: "articleExcerptBadge" | "sahihCorpusBadge";
  guideI18nKey: "articleExcerptGuide" | "sahihCorpusGuide";
};

export const HADITH_ARTICLE_EXCERPT: HadithContentTypeDef = {
  id: "articleExcerpt",
  badgeI18nKey: "articleExcerptBadge",
  guideI18nKey: "articleExcerptGuide",
};

export const HADITH_SAHIH_CORPUS: HadithContentTypeDef = {
  id: "sahihCorpus",
  badgeI18nKey: "sahihCorpusBadge",
  guideI18nKey: "sahihCorpusGuide",
};

export const HADITH_CONTENT_TYPES: Record<HadithContentTypeId, HadithContentTypeDef> = {
  articleExcerpt: HADITH_ARTICLE_EXCERPT,
  sahihCorpus: HADITH_SAHIH_CORPUS,
};

export type HadithContentLabelingChecklist = {
  engineeringCompletedAtIso: string;
  /** UX/meta labeling ready; not religious corpus approval */
  labelingComplete: boolean;
  checklist: string[];
};

export const HADITH_CONTENT_LABELING: HadithContentLabelingChecklist = {
  engineeringCompletedAtIso: "2026-06-17",
  labelingComplete: true,
  checklist: [
    "HadithHub — cross-link, content guide, articleExcerpt badge әр картада",
    "ScrapedHadithMuftyatList/Detail — articleExcerpt badge + disclaimer",
    "HadithList/Detail — sahihCorpus badge + titleMeaning/sourceOnlyNote",
    "kk.hadith.contentTypes — екі түрдің қысқа анықтaması",
  ],
};
