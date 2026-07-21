import { useEffect, useState } from "react";
import {
  autoTranslateMany,
  type AutoTranslateTarget,
} from "../services/autoTranslate";
import { useAppLocale, useLocaleRevision } from "../i18n/runtime";
import { resolveKkAutoTranslationText } from "./useKkAutoTranslator";

/**
 * Қазақ прозасының өрістерін таңдалған тілге bundled offline dictionary/cache арқылы аударады.
 * Тіл kk емес болса аударма жоқ / қазақ әріптері бар — түпнұсқа емес, «…».
 * `translated` — нақты аударма бар (эллипсис емес) және тіл kk емес.
 */
export function useAutoTranslatedFields(fields: string[]): {
  values: string[];
  translated: boolean;
  loading: boolean;
} {
  const locale = useAppLocale();
  const localeRevision = useLocaleRevision();
  const [values, setValues] = useState<string[]>(() =>
    locale === "kk" ? fields : fields.map((f) => resolveKkAutoTranslationText(f, locale, {}))
  );
  const [translated, setTranslated] = useState(false);
  const [loading, setLoading] = useState(false);

  const joinKey = fields.join("\u0001");

  useEffect(() => {
    if (locale === "kk") {
      setValues(fields);
      setTranslated(false);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setValues(fields.map((f) => resolveKkAutoTranslationText(f, locale, {})));
    void (async () => {
      const target = locale as AutoTranslateTarget;
      const out = await autoTranslateMany(fields, target);
      if (!alive) return;
      const map: Record<string, string> = {};
      fields.forEach((orig, i) => {
        const t = out[i];
        if (t) map[orig] = t;
      });
      const merged = fields.map((orig) => resolveKkAutoTranslationText(orig, locale, map));
      setValues(merged);
      setTranslated(merged.some((v, i) => v !== "…" && v !== fields[i]));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // localeRevision: offline pack merge must re-resolve «…» → real translations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, localeRevision, joinKey]);

  return { values, translated, loading };
}
