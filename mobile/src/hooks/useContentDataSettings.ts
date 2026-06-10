import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { runContentSyncWithIncrementalPatches } from "../services/contentSync";
import { readContentSyncState } from "../services/contentSync";
import { loadQuranListCache } from "../storage/quranListCache";
import { getValidAccessToken } from "../storage/authTokens";
import { kk } from "../i18n/kk";
import {
  fetchContentStats,
  fetchPlatformReadiness,
  type ContentStatsPayload,
  type ReadinessPayload,
} from "../services/platformApiClient";

export type OfflineQualitySnapshot = {
  quranSurahRows: number;
  quranSavedAt: string | null;
  syncEtag: string | null;
  syncSince: string | null;
  checkedAt: string;
};

export function useContentDataSettings() {
  const [apiBase] = useState(() => getRaqatApiBase());
  const [stats, setStats] = useState<ContentStatsPayload | null>(null);
  const [readiness, setReadiness] = useState<ReadinessPayload | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncHint, setSyncHint] = useState<string | null>(null);
  const [offlineQualityLoading, setOfflineQualityLoading] = useState(false);
  const [offlineQuality, setOfflineQuality] = useState<OfflineQualitySnapshot | null>(null);

  const refreshOfflineQuality = useCallback(async () => {
    setOfflineQualityLoading(true);
    try {
      const [quranList, syncState] = await Promise.all([
        loadQuranListCache(),
        readContentSyncState(),
      ]);
      setOfflineQuality({
        quranSurahRows: quranList?.list?.length ?? 0,
        quranSavedAt: quranList?.savedAt ?? null,
        syncEtag: syncState.etag,
        syncSince: syncState.since,
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setOfflineQualityLoading(false);
    }
  }, []);

  const refreshPlatformStats = useCallback(async () => {
    const base = getRaqatApiBase();
    if (!base) {
      setStats(null);
      setReadiness(null);
      return;
    }
    const ms = 18_000;
    const [sr, rr] = await Promise.allSettled([
      fetchContentStats(base, ms),
      fetchPlatformReadiness(base, ms),
    ]);
    setStats(sr.status === "fulfilled" ? sr.value : null);
    setReadiness(rr.status === "fulfilled" ? rr.value : null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshOfflineQuality();
      void refreshPlatformStats();
    }, [refreshOfflineQuality, refreshPlatformStats])
  );

  const runManualContentSync = useCallback(async () => {
    const base = getRaqatApiBase();
    if (!base) return;
    setSyncLoading(true);
    setSyncHint(null);
    try {
      const bearer = await getValidAccessToken();
      const r = await runContentSyncWithIncrementalPatches(base, {
        timeoutMs: 120_000,
        accessToken: bearer || undefined,
      });
      if (r.unchanged) {
        setSyncHint(kk.settings.contentSyncUnchanged);
      } else if (r.patch) {
        const { quranPatched, errors } = r.patch;
        let msg = kk.settings.contentSyncDone(quranPatched, 0);
        if (errors.length) msg += ` · ${errors.length} ескерту`;
        setSyncHint(msg);
      } else {
        setSyncHint(kk.settings.contentSyncUnchanged);
      }
      await refreshOfflineQuality();
    } catch {
      setSyncHint(kk.settings.contentSyncError);
    } finally {
      setSyncLoading(false);
    }
  }, [refreshOfflineQuality]);

  return {
    apiBase,
    stats,
    readiness,
    syncLoading,
    syncHint,
    offlineQuality,
    offlineQualityLoading,
    refreshOfflineQuality,
    runManualContentSync,
  };
}
