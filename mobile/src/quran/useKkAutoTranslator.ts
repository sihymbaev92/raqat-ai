import { useCallback, useEffect, useRef, useState } from "react";
import {
  autoTranslateMany,
  type AutoTranslateTarget,
} from "../services/autoTranslate";
import { getOfflineAutoTranslation } from "../services/offlineAutoTranslations";
import { useAppLocale, useLocaleRevision } from "../i18n/runtime";

/** Қазақ әріптері — басқа тілде экранға шықпауы керек. */
const KK_SPECIFIC = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

export function resolveKkAutoTranslationText(
  text: string,
  locale: string,
  map: Record<string, string>
): string {
  const t = text ?? "";
  if (locale === "kk" || !t.trim()) return text;
  const target = locale as AutoTranslateTarget;
  const bundled = getOfflineAutoTranslation(t, target);
  if (bundled) return bundled;
  const cached = map[t];
  if (cached != null) return cached;
  if (KK_SPECIFIC.test(t)) return "…";
  return t;
}

/**
 * Үлкен экрандарға арналған машина-аударма көмекшісі.
 * Дайын болмаса және мәтінде қазақ әріптері болса — «…» (қазақша қалмайды).
 */
export function useKkAutoTranslator(): { tr: (text: string) => string; translated: boolean } {
  const locale = useAppLocale();
  useLocaleRevision();
  const [map, setMap] = useState<Record<string, string>>({});
  const requestedRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<string[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestedRef.current = new Set();
    pendingRef.current = [];
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    setMap({});
  }, [locale]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  const scheduleFlush = useCallback(() => {
    if (locale === "kk") return;
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      const batch = pendingRef.current;
      pendingRef.current = [];
      if (!batch.length) return;
      void (async () => {
        const target = locale as AutoTranslateTarget;
        const out = await autoTranslateMany(batch, target);
        const updates: Record<string, string> = {};
        batch.forEach((src, i) => {
          const translated = out[i];
          if (translated) updates[src] = translated;
        });
        if (Object.keys(updates).length) {
          setMap((prev) => ({ ...prev, ...updates }));
        }
      })();
    }, 30);
  }, [locale]);

  const tr = useCallback(
    (text: string): string => {
      const t = text ?? "";
      if (locale === "kk" || !t.trim()) return text;
      const resolved = resolveKkAutoTranslationText(t, locale, map);
      if (resolved === t || resolved === "…") {
        if (!requestedRef.current.has(t)) {
          requestedRef.current.add(t);
          pendingRef.current.push(t);
          scheduleFlush();
        }
      }
      return resolved;
    },
    [locale, map, scheduleFlush]
  );

  return { tr, translated: locale !== "kk" };
}
