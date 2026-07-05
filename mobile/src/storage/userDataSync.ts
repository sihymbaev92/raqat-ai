import { syncHatimWithServerBidirectional } from "./hatimProgress";
import { syncQuranAyahMarkersWithServerBidirectional } from "./quranAyahMarkers";
import { syncQuranBookmarksWithServerBidirectional } from "./quranBookmarks";
import { syncQuranLastReadWithServerBidirectional } from "./quranLastRead";

/** JWT аккаунт: хатым, соңғы оқу, аят маркерлері, сүре бетбелгілері — екіжақты sync. */
export async function syncUserDataWithServerBidirectional(): Promise<void> {
  await Promise.allSettled([
    syncHatimWithServerBidirectional(),
    syncQuranLastReadWithServerBidirectional(),
    syncQuranAyahMarkersWithServerBidirectional(),
    syncQuranBookmarksWithServerBidirectional(),
  ]);
}
