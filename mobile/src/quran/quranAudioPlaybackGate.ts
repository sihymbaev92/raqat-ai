import * as Network from "expo-network";
import { isQuranAudioCached } from "../services/quranAudioCache";
import {
  isReciterEditionFullyDownloaded,
  loadQuranAudioDownloadState,
  type ReciterEditionDownloadState,
} from "../storage/quranAudioDownloadPrefs";

export type QuranAudioPlaybackSource = "cache" | "stream";

export type QuranAudioPlaybackPlan = {
  remoteUri: string;
  uri: string;
  source: QuranAudioPlaybackSource;
  needsNetwork: boolean;
};

/** Single-ayah play: cache hit → local file; else stream remote (background cache). */
export async function planQuranAyahAudioPlayback(remoteUri: string): Promise<QuranAudioPlaybackPlan> {
  const cached = await isQuranAudioCached(remoteUri);
  if (cached) {
    const { resolveCachedOrRemoteQuranAudioUri } = await import("../services/quranAudioCache");
    const uri = await resolveCachedOrRemoteQuranAudioUri(remoteUri);
    return { remoteUri, uri, source: "cache", needsNetwork: false };
  }
  return { remoteUri, uri: remoteUri, source: "stream", needsNetwork: true };
}

export async function isStreamingNetworkAvailable(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected === false) return false;
    if (state.isInternetReachable === false) return false;
    return true;
  } catch {
    return true;
  }
}

export async function loadReciterEditionOfflineState(
  edition: string
): Promise<ReciterEditionDownloadState | undefined> {
  const state = await loadQuranAudioDownloadState();
  return state.editions[edition];
}

export async function isReciterEditionOfflineReady(edition: string): Promise<boolean> {
  const ed = await loadReciterEditionOfflineState(edition);
  return isReciterEditionFullyDownloaded(ed);
}
