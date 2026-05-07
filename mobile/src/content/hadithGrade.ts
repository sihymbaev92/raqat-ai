import { kk } from "../i18n/kk";

export function resolveHadithGradeText(grade?: string | null): string {
  const gradeRaw = (grade || "").trim();
  return gradeRaw || kk.hadith.gradeUnknown;
}
