import { syncHatimWithServerBidirectional } from "../storage/hatimProgress";
import { syncQuranBookmarksWithServerBidirectional } from "../storage/quranBookmarks";
import { getValidAccessToken } from "../storage/authTokens";

/** Кіру / foreground: хатым және құран белгілерін сервермен синхрондау. */
export async function syncAccountDataWithServerBidirectional(): Promise<void> {
  const access = await getValidAccessToken();
  if (!access) return;
  await Promise.allSettled([
    syncHatimWithServerBidirectional(),
    syncQuranBookmarksWithServerBidirectional(),
  ]);
}
