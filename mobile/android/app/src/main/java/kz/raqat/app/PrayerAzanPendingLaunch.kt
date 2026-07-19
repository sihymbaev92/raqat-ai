package kz.raqat.app

import android.content.Context

/** Азан дыбысы ойнаса да RN навигация кешіккенде экран параметрлерін сақтау. */
object PrayerAzanPendingLaunch {
  private const val PREFS = "raqat_prayer_azan_pending_v1"
  private const val KEY_LABEL = "label"
  private const val KEY_ENTERED_TITLE = "enteredTitle"
  private const val KEY_TIME = "time"
  private const val KEY_SOUND_ID = "soundId"
  private const val KEY_SALAT_KEY = "salatKey"
  private const val KEY_AT_MS = "at_ms"
  private const val TTL_MS = 30L * 60L * 1000L

  fun save(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_LABEL, label)
      .putString(KEY_ENTERED_TITLE, enteredTitle)
      .putString(KEY_TIME, time)
      .putString(KEY_SOUND_ID, soundId)
      .putString(KEY_SALAT_KEY, salatKey)
      .putLong(KEY_AT_MS, System.currentTimeMillis())
      .apply()
  }

  fun read(context: Context): Map<String, String>? {
    val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val label = prefs.getString(KEY_LABEL, null)?.trim().orEmpty()
    if (label.isEmpty()) return null
    val atMs = prefs.getLong(KEY_AT_MS, 0L)
    if (atMs > 0L && System.currentTimeMillis() - atMs > TTL_MS) {
      clear(context)
      return null
    }
    return mapOf(
      "label" to label,
      "enteredTitle" to (prefs.getString(KEY_ENTERED_TITLE, "") ?: ""),
      "time" to (prefs.getString(KEY_TIME, "") ?: ""),
      "soundId" to (prefs.getString(KEY_SOUND_ID, "adhan_haramain") ?: "adhan_haramain"),
      "salatKey" to (prefs.getString(KEY_SALAT_KEY, "") ?: "")
    )
  }

  fun clear(context: Context) {
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
  }
}
