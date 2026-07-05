import type { PrayerNotifSoundId } from "../storage/prefs";

/** Азан жазбасының шығу тегі (ISO 3166-1 alpha-2) */
export const PRAYER_NOTIF_SOUND_COUNTRY: Record<Exclude<PrayerNotifSoundId, "off">, string> = {
  adhan_haramain: "SA",
};
