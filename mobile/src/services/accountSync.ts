import { syncHatimWithServerBidirectional } from "../storage/hatimProgress";
import { syncQuranBookmarksWithServerBidirectional } from "../storage/quranBookmarks";
import { getValidAccessToken } from "../storage/authTokens";

export type AccountSyncResult =
  | { status: "skipped"; reason: "no_token" }
  | { status: "ok"; hatim: boolean; bookmarks: boolean }
  | { status: "partial"; hatim: boolean; bookmarks: boolean }
  | { status: "failed" };

/** Кіру / foreground: хатым және құран белгілерін сервермен синхрондау. */
export async function syncAccountDataWithServerBidirectional(): Promise<AccountSyncResult> {
  const access = await getValidAccessToken();
  if (!access) return { status: "skipped", reason: "no_token" };

  const [hatim, bookmarks] = await Promise.allSettled([
    syncHatimWithServerBidirectional(),
    syncQuranBookmarksWithServerBidirectional(),
  ]);

  const hatimOk = hatim.status === "fulfilled";
  const bookmarksOk = bookmarks.status === "fulfilled";

  if (hatimOk && bookmarksOk) return { status: "ok", hatim: true, bookmarks: true };
  if (hatimOk || bookmarksOk) {
    return { status: "partial", hatim: hatimOk, bookmarks: bookmarksOk };
  }
  return { status: "failed" };
}
