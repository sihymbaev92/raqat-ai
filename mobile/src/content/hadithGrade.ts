import { kk } from "../i18n/kk";
import { getCurrentLocale } from "../i18n/runtime";
import { resolveKkAutoTranslationText } from "../quran/useKkAutoTranslator";

const SAHIH_MARKERS = /сахих|sahih|صحيح|صحيحه|صيح/i;
const KK_SPECIFIC = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

/** Grade UI тілінде; шикі қазақша chrome leak болмасын. */
export function resolveHadithGradeText(grade?: string | null): string {
  const gradeRaw = (grade || "").trim();
  if (!gradeRaw) return kk.hadith.gradeUnknown;
  if (SAHIH_MARKERS.test(gradeRaw)) return kk.hadith.gradeSahih;
  const locale = getCurrentLocale();
  if (locale !== "kk" && KK_SPECIFIC.test(gradeRaw)) {
    const tr = resolveKkAutoTranslationText(gradeRaw, locale, {});
    if (tr && tr !== "…" && !KK_SPECIFIC.test(tr)) return tr;
    return kk.hadith.gradeUnknown;
  }
  return gradeRaw;
}
