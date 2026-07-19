import { useCallback, useEffect, useRef, useState } from "react";
import {
  autoTranslateMany,
  type AutoTranslateTarget,
} from "../services/autoTranslate";
import { getOfflineAutoTranslation } from "../services/offlineAutoTranslations";
import { useAppLocale, useLocaleRevision } from "../i18n/runtime";

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
  return t;
}

/**
 * Үлкен экрандарға арналған машина-аударма көмекшісі.
 * `tr(text)` — қазақша жолды ағымдағы тілге bundled offline dictionary/cache арқылы аударады; дайын болмаса
 * қазақшаны қайтарады. Тіл kk болса — әрқашан түпнұсқа. Араб/транскрипцияны
 * шақырушы `tr`-ге БЕРМЕУІ керек (тек таза қазақ прозасын аудару үшін).
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
          const t = out[i];
          if (t) updates[src] = t;
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
      const target = locale as AutoTranslateTarget;
      const resolved = resolveKkAutoTranslationText(t, locale, map);
      if (resolved !== t) return resolved;
      if (!requestedRef.current.has(t)) {
        requestedRef.current.add(t);
        pendingRef.current.push(t);
        scheduleFlush();
      }
      return t;
    },
    [locale, map, scheduleFlush]
  );

  return { tr, translated: locale !== "kk" };
}
