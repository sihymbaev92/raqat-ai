package kz.raqat.app

/** Azan alarm/экран белсенді — legacy notification clear блоктау. */
object PrayerAzanActiveSession {
  @Volatile
  var active: Boolean = false
}
