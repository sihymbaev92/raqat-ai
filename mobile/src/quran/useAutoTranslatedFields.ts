import { useEffect, useState } from "react";
import {
  autoTranslateMany,
  type AutoTranslateTarget,
} from "../services/autoTranslate";
import { useAppLocale } from "../i18n/runtime";

/**
 * Қазақ прозасының өрістерін таңдалған тілге bundled offline dictionary/cache арқылы аударады.
 * Тіл kk болса немесе аударма сәтсіз болса — түпнұсқа қазақша қайтады.
 * `translated` — аударма дайын әрі тіл kk емес болғанда true (ескерту көрсету үшін).
 */
export function useAutoTranslatedFields(fields: string[]): {
  values: string[];
  translated: boolean;
  loading: boolean;
} {
  const locale = useAppLocale();
  const [values, setValues] = useState<string[]>(fields);
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
    void (async () => {
      const target = locale as AutoTranslateTarget;
      const out = await autoTranslateMany(fields, target);
      if (!alive) return;
      const merged = fields.map((orig, i) => out[i] ?? orig);
      setValues(merged);
      setTranslated(true);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, joinKey]);

  return { values, translated, loading };
}
