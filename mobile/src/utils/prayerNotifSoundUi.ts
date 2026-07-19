import { kk } from "../i18n/kk";
import type { PrayerNotifSoundId } from "../storage/prefs";

/** Баптаулар мен намаз экранындағы дыбыс жолының атауы */
export function prayerNotifSoundLabel(id: PrayerNotifSoundId): string {
  switch (id) {
    case "off":
      return kk.prayer.notifSoundOff;
    case "adhan_haramain":
      return kk.prayer.notifSoundAdhanHaramain;
    default: {
      const _e: never = id;
      return _e;
    }
  }
}

/** @deprecated Use prayerNotifSoundLabel. */
export const prayerNotifSoundLabelKk = prayerNotifSoundLabel;
