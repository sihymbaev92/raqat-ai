import { kk } from "../i18n/kk";
import type { PrayerNotifSoundId } from "../storage/prefs";

/** Баптаулар мен намаз экранындағы дыбыс жолының қазақша атауы */
export function prayerNotifSoundLabelKk(id: PrayerNotifSoundId): string {
  switch (id) {
    case "off":
      return kk.prayer.notifSoundOff;
    case "adhan_haramain":
      return kk.prayer.notifSoundAdhanHaramain;
    case "adhan_madina_clear":
      return kk.prayer.notifSoundAdhanMadinaClear;
    case "adhan_makkah_live":
      return kk.prayer.notifSoundAdhanMakkahLive;
    case "adhan_soft_cc0":
      return kk.prayer.notifSoundAdhanSoftCc0;
    case "adhan_takbir_high":
      return kk.prayer.notifSoundAdhanTakbirHigh;
    default: {
      const _e: never = id;
      return _e;
    }
  }
}
