import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { kk } from "../i18n/kk";
import { getRaqatApiBase, isRaqatApiOnlyMode } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { fetchPlatformQuranSurah } from "../services/platformApiClient";
import { getValidAccessToken } from "../storage/authTokens";
import { seedBundledQuranCachesIfNeeded } from "../services/bundledQuranSeed";
import { ensureBundledKkReaderLoaded } from "../services/bundledQuranReader";
import { enrichAyahsFromBundledQuranDb, enrichAyahsFromBundledQuranDbSync } from "../services/quranKkBundledLookup";
import { fetchAlquranUthmaniAndUnicodeAyahs } from "../services/alquranSurahDualArabicFetch";
import {
  loadSurahAyahsCache,
  mergeAyahsPreserveOfflineExtras,
  mergeDualAlquranArabicOntoBase,
  mergeTurkishPrintArabicFromParsed,
  parseAyahsFromPlatformPayload,
  saveSurahAyahsCache,
  type CachedAyah,
} from "../storage/quranSurahCache";
import {
  enrichAyahsWithAlquranTajweed,
  QURAN_CLOUD_FETCH_TIMEOUT_MS,
} from "../services/quranSurahTajweedEnrich";

export function useQuranSurahLoad(surahNumber: number) {
  const activeSurahLoadRef = useRef(surahNumber);
  activeSurahLoadRef.current = surahNumber;

  const [ayahs, setAyahs] = useState<CachedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const ayahsRef = useRef(ayahs);
  useEffect(() => {
    ayahsRef.current = ayahs;
  }, [ayahs]);

  useLayoutEffect(() => {
    setLoading(true);
    setAyahs([]);
    setErr(null);
  }, [surahNumber]);

  const fetchRemote = useCallback(async () => {
    const fetchedFor = surahNumber;
    const stillCurrent = () => activeSurahLoadRef.current === fetchedFor;
    const base = getRaqatApiBase();
    const apiOnly = isRaqatApiOnlyMode();
    const bearer = ((await getValidAccessToken()) ?? "").trim() || undefined;
    if (base) {
      try {
        const data = await fetchPlatformQuranSurah(base, surahNumber, {
          contentSecret: getRaqatContentReadSecret(),
          authorizationBearer: bearer,
        });
        const fromPl = parseAyahsFromPlatformPayload(data);
        if (fromPl?.length) {
          const prev = await loadSurahAyahsCache(surahNumber);
          let merged = mergeAyahsPreserveOfflineExtras(fromPl, prev?.ayahs);
          if (!apiOnly) {
            const { madinah, turkishPrint } = await fetchAlquranUthmaniAndUnicodeAyahs(
              surahNumber,
              QURAN_CLOUD_FETCH_TIMEOUT_MS
            );
            merged = mergeDualAlquranArabicOntoBase(merged, madinah, turkishPrint);
          }
          merged = await enrichAyahsWithAlquranTajweed(surahNumber, merged);
          merged = await enrichAyahsFromBundledQuranDb(surahNumber, merged);
          if (!stillCurrent()) return;
          setAyahs(merged);
          setErr(null);
          await saveSurahAyahsCache(surahNumber, merged);
          return;
        }
      } catch (e) {
        if (apiOnly) throw e;
      }
    } else if (apiOnly) {
      throw new Error(kk.quran.apiOnlyRequired);
    }
    if (apiOnly) throw new Error(kk.quran.apiOnlyRequired);
    const { madinah, turkishPrint } = await fetchAlquranUthmaniAndUnicodeAyahs(
      surahNumber,
      QURAN_CLOUD_FETCH_TIMEOUT_MS
    );
    if (!madinah?.length) throw new Error(kk.quran.ayahError);
    const prev = await loadSurahAyahsCache(surahNumber);
    let merged = mergeAyahsPreserveOfflineExtras(madinah, prev?.ayahs);
    merged = mergeTurkishPrintArabicFromParsed(merged, turkishPrint);
    merged = await enrichAyahsWithAlquranTajweed(surahNumber, merged);
    merged = await enrichAyahsFromBundledQuranDb(surahNumber, merged);
    if (!stillCurrent()) return;
    setAyahs(merged);
    setErr(null);
    await saveSurahAyahsCache(surahNumber, merged);
  }, [surahNumber]);

  useEffect(() => {
    let mounted = true;
    const target = surahNumber;
    const ok = () => mounted && activeSurahLoadRef.current === target;
    (async () => {
      let hadCached = false;
      const cached = await loadSurahAyahsCache(target);
      if (ok() && cached?.ayahs?.length) {
        hadCached = true;
        setAyahs(await enrichAyahsFromBundledQuranDb(target, cached.ayahs));
        setLoading(false);
      }

      const applySeed = async () => {
        try {
          await seedBundledQuranCachesIfNeeded();
        } catch {
          /* кеш бандлдан толтыру сәтсіз */
        }
        if (!ok()) return;
        const afterSeed = await loadSurahAyahsCache(target);
        if (afterSeed?.ayahs?.length && ok()) {
          hadCached = true;
          setAyahs(await enrichAyahsFromBundledQuranDb(target, afterSeed.ayahs));
          setErr(null);
          setLoading(false);
        }
      };

      if (hadCached) {
        void applySeed();
      } else {
        await applySeed();
      }
      if (!ok()) return;

      try {
        await fetchRemote();
      } catch (e) {
        if (ok() && !hadCached) {
          const again = await loadSurahAyahsCache(target);
          if (ok() && again?.ayahs?.length) {
            setAyahs(await enrichAyahsFromBundledQuranDb(target, again.ayahs));
            setErr(null);
          } else if (ok()) {
            setErr(e instanceof Error ? e.message : kk.quran.ayahError);
          }
        }
      } finally {
        if (ok()) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [surahNumber, fetchRemote, loadAttempt]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await ensureBundledKkReaderLoaded().catch(() => {});
      if (!alive) return;
      setAyahs((prev) => {
        if (!prev.length) return prev;
        const enriched = enrichAyahsFromBundledQuranDbSync(surahNumber, prev);
        return enriched === prev ? prev : enriched;
      });
    })();
    return () => {
      alive = false;
    };
  }, [surahNumber, ayahs.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRemote();
    } catch {
      /* кеш мәтіні қалсын */
    } finally {
      setRefreshing(false);
    }
  }, [fetchRemote]);

  const retryLoadSurah = useCallback(() => {
    setErr(null);
    setLoading(true);
    setLoadAttempt((n) => n + 1);
  }, []);

  return {
    ayahs,
    setAyahs,
    ayahsRef,
    loading,
    err,
    refreshing,
    onRefresh,
    retryLoadSurah,
    fetchRemote,
    activeSurahLoadRef,
  };
}
