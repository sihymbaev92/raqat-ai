import { kk } from "../i18n/kk";

const SAHIH_MARKERS = /сахих|sahih|صحيح|صحيحه|صيح/i;

/** Grade UI тілінде; шикі қазақша/арабша chrome leak азайту. */
export function resolveHadithGradeText(grade?: string | null): string {
  const gradeRaw = (grade || "").trim();
  if (!gradeRaw) return kk.hadith.gradeUnknown;
  if (SAHIH_MARKERS.test(gradeRaw)) return kk.hadith.gradeSahih;
  return gradeRaw;
}
