/**
 * Намаз гид — діни сарапшы қол қоюы метадеректері (P0 handoff).
 * Инженериялық дайындық кодта аяқталды; ресми sign-off — сыртқы Ханафи сарапшы.
 */

export type NamazScholarReviewStatus =
  | "engineering_complete"
  | "scholar_approved"
  | "scholar_changes_requested";

export type NamazReligiousSource = {
  id: string;
  labelKk: string;
  url?: string;
};

export type NamazScholarReviewChecklist = {
  madhhab: "hanafi";
  aqida: "maturidi";
  status: NamazScholarReviewStatus;
  /** true only after external scholar signs religious-content-review-packet */
  approvedForPublicRelease: boolean;
  reviewerName: string | null;
  reviewedAtIso: string | null;
  engineeringCompletedAtIso: string;
  reviewPacketPath: string;
  sources: NamazReligiousSource[];
  /** Code/UX readiness — not religious approval */
  engineeringChecklist: string[];
  /** Items for external Hanafi reviewer (handoff) */
  scholarChecklist: string[];
};

export const NAMAZ_RELIGIOUS_REVIEW: NamazScholarReviewChecklist = {
  madhhab: "hanafi",
  aqida: "maturidi",
  status: "engineering_complete",
  approvedForPublicRelease: false,
  reviewerName: null,
  reviewedAtIso: null,
  engineeringCompletedAtIso: "2026-06-17",
  reviewPacketPath: "docs/operations/religious-content-review-packet-2026-06.md",
  sources: [
    {
      id: "qmdb",
      labelKk: "ҚМДБ ресми бағыты (Fatua.kz · Muftyat.kz)",
      url: "https://fatua.kz",
    },
    {
      id: "hanafi",
      labelKk: "Ханафи фиқһ — практикалық оқу мәтіні (пәтуа емес)",
    },
    {
      id: "alquran",
      labelKk: "Намаз дұғалары — сүннет нұсқалары, ұстазбен растау",
    },
  ],
  engineeringChecklist: [
    "namazContent.ts — 14 теориялық бөлім UI арқылы қолжетімді",
    "namazLearningContent.ts — қадамдық оқу, араб/транскрипция/мағына",
    "namazWuduSteps + namazWuduExtended — дәрет визуал мен теория",
    "namazMenzikir — 8 бөлімдік оқу картасы NAMAZ_GUIDE_SECTIONS-ке байланған",
    "ContentGuideScreens — review banner, теория, сынақ, жамағат/жаназа карталары",
    "religious-content-review-packet-2026-06.md — external scholar handoff",
  ],
  scholarChecklist: [
    "Дәрет парыз/сүннет тізімі Ханафи фиқһымен салыстырылды.",
    "Намаз қадамдарының реті имаммен тексерілді.",
    "Қиям, Әт-тахият, салауат мәтіні толық оқылыммен расталды.",
    "Транскрипция мен мағына тілдік редакциядан өтті.",
    "Ер/әйел ескертпелері жергілікті ұстаз нұсқауымен бекітілді.",
    "Сүннет кестесі (VII бөлім) жергілікті мешіт практикасымен сәйкес.",
    "Жаназа намазы (XIII) — нақты фиқһ үкімдері ресми көзбен расталды.",
    "Азан мәтіні (PrayerAzanScreen, kk.ts) — араб/аударма/транслит.",
  ],
};

/** @deprecated use NAMAZ_RELIGIOUS_REVIEW */
export const NAMAZ_CONTENT_REVIEW = {
  madhhab: NAMAZ_RELIGIOUS_REVIEW.madhhab,
  approvedForPublicRelease: NAMAZ_RELIGIOUS_REVIEW.approvedForPublicRelease,
  reviewerName: NAMAZ_RELIGIOUS_REVIEW.reviewerName,
  reviewedAtIso: NAMAZ_RELIGIOUS_REVIEW.reviewedAtIso,
  checklist: NAMAZ_RELIGIOUS_REVIEW.scholarChecklist,
};

export function namazScholarReviewPending(): boolean {
  return !NAMAZ_RELIGIOUS_REVIEW.approvedForPublicRelease;
}

export function namazGuideSectionByTitle(title: string) {
  // lazy import avoided — callers pass from NAMAZ_GUIDE_SECTIONS
  return title.trim();
}
