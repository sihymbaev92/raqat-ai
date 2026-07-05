import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  isReciterEditionOfflineReady,
  loadReciterEditionOfflineState,
} from "../quran/quranAudioPlaybackGate";
import {
  isReciterEditionFullyDownloaded,
  type ReciterEditionDownloadState,
} from "../storage/quranAudioDownloadPrefs";

export type QuranReciterOfflineStatus = {
  edition: string;
  fullyDownloaded: boolean;
  downloadState?: ReciterEditionDownloadState;
  reloading: boolean;
  reload: () => void;
};

export function useQuranReciterOfflineStatus(edition: string): QuranReciterOfflineStatus {
  const [fullyDownloaded, setFullyDownloaded] = useState(false);
  const [downloadState, setDownloadState] = useState<ReciterEditionDownloadState | undefined>();
  const [reloading, setReloading] = useState(true);

  const reload = useCallback(() => {
    let alive = true;
    setReloading(true);
    void (async () => {
      const [ready, ed] = await Promise.all([
        isReciterEditionOfflineReady(edition),
        loadReciterEditionOfflineState(edition),
      ]);
      if (!alive) return;
      setFullyDownloaded(ready);
      setDownloadState(ed);
      setReloading(false);
    })();
    return () => {
      alive = false;
    };
  }, [edition]);

  useEffect(() => {
    const dispose = reload();
    return dispose;
  }, [reload]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") reload();
    });
    return () => sub.remove();
  }, [reload]);

  return {
    edition,
    fullyDownloaded,
    downloadState,
    reloading,
    reload,
  };
}

/** Sync helper for settings rows (already have download state in memory). */
export function reciterEditionOfflineReadyFromState(
  state: ReciterEditionDownloadState | undefined
): boolean {
  return isReciterEditionFullyDownloaded(state);
}
