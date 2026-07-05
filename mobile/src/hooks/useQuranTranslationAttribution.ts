import { useEffect, useState } from "react";
import type { AppLocale } from "../i18n/runtime";
import { quranTranslationAttributionForLocale } from "../i18n/quranTranslationAttribution";
import { ensureQuranKkProvenanceLoaded } from "../services/quranKkProvenance";

/** Оқу/tізім экрандарында аударма дереккөз footer (kk — бандл provenance). */
export function useQuranTranslationAttribution(locale: AppLocale): string {
  const [line, setLine] = useState(() => quranTranslationAttributionForLocale(locale));

  useEffect(() => {
    if (locale !== "kk") {
      setLine(quranTranslationAttributionForLocale(locale));
      return;
    }
    let alive = true;
    void ensureQuranKkProvenanceLoaded().then((p) => {
      if (alive) setLine(p.footerLine);
    });
    return () => {
      alive = false;
    };
  }, [locale]);

  return line;
}
