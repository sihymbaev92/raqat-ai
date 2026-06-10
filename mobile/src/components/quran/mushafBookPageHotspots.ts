import type { MushafAyahMapHotspot } from "../../quran/mushafAyahMap";
import type { MushafAyahRef } from "../../quran/mushafBookTypes";

export function mushafHotspotActive(
  spot: MushafAyahMapHotspot,
  playingRef: MushafAyahRef | null,
  loadingAyahAudio: MushafAyahRef | null,
  resumeHighlight: MushafAyahRef | null,
  ayahAudioIsPlaying: boolean
): boolean {
  const ref = { surah: spot.surah, ayah: spot.ayah };
  if (loadingAyahAudio?.surah === ref.surah && loadingAyahAudio.ayah === ref.ayah) return true;
  if (resumeHighlight?.surah === ref.surah && resumeHighlight.ayah === ref.ayah) return true;
  if (playingRef?.surah === ref.surah && playingRef.ayah === ref.ayah && ayahAudioIsPlaying) {
    return true;
  }
  return false;
}
