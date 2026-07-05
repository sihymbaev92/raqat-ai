import { Platform } from "react-native";
import {
  CONTENT_PACKS,
  type ContentPackId,
} from "../config/contentPackManifest";
import {
  clearContentPackCache,
  downloadAllRemoteContentPacks,
  downloadContentPack,
  isContentPackReady,
  loadContentPackSnapshot,
  maybeAutoDownloadContentPacksOnBoot,
  patchContentPackPrefs,
  type ContentPackSnapshot,
} from "../storage/contentPackDownloadPrefs";

export {
  clearContentPackCache,
  downloadAllRemoteContentPacks,
  downloadContentPack,
  isContentPackReady,
  loadContentPackSnapshot,
  maybeAutoDownloadContentPacksOnBoot,
  patchContentPackPrefs,
  type ContentPackId,
  type ContentPackSnapshot,
};

export function contentPackStatusLabel(
  packId: ContentPackId,
  snap: ContentPackSnapshot
): "ready" | "partial" | "missing" {
  const st = snap.packs[packId];
  if (!st) return "missing";
  if (st.status === "ready" || st.downloadedFiles >= st.totalFiles) return "ready";
  if (st.downloadedFiles > 0) return "partial";
  const def = CONTENT_PACKS.find((p) => p.id === packId);
  if (def?.bundledInApk) return "ready";
  return "missing";
}

/** Native boot: Wi‑Fi болса remote pack-терді фонда жүктеу (opt-in prefs). */
export function scheduleContentPackAutoDownload(): void {
  if (Platform.OS === "web") return;
  setTimeout(() => {
    void maybeAutoDownloadContentPacksOnBoot();
  }, 4_500);
}
