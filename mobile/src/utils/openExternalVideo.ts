import { Linking, Platform } from "react-native";

/** YouTube watch URL → video id (бос болса null). */
export function youtubeVideoIdFromWatchUrl(watchUrl: string): string | null {
  const m = watchUrl.match(/[?&]v=([^&]+)/);
  return m?.[1]?.trim() || null;
}

/**
 * Бейне — қолданба ішіндегі embed емес: YouTube app (жылдам) немесе браузер.
 * Офлайнда Linking қате береді — шақырушы Alert көрсетеді.
 */
export async function openYouTubeWatchUrl(watchUrl: string): Promise<void> {
  const id = youtubeVideoIdFromWatchUrl(watchUrl);
  if (id && Platform.OS !== "web") {
    for (const uri of [`vnd.youtube://${id}`, `youtube://${id}`]) {
      try {
        if (await Linking.canOpenURL(uri)) {
          await Linking.openURL(uri);
          return;
        }
      } catch {
        /* келесі кандидат */
      }
    }
  }
  await Linking.openURL(watchUrl);
}

/** Тікелей эфир / live бет — әрқашан сыртқы браузер (WebView embed жоқ). */
export async function openLiveStreamUrl(uri: string): Promise<void> {
  await Linking.openURL(uri);
}
