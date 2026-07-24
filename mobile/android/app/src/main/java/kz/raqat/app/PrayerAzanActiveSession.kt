package kz.raqat.app

import android.content.Context

/**
 * Азан сессиясы — FSI/legacy cleaner және activity retry үшін.
 * Process death-тен кейін SharedPreferences арқылы қалпына келеді (30 мин TTL).
 *
 * [generation] dismiss кезінде өседі — кешіктірілген retry/FGS stale wave-ті өшіреді.
 */
object PrayerAzanActiveSession {
  private const val PREFS = "raqat_prayer_azan_session_v1"
  private const val KEY_ACTIVE = "active"
  private const val KEY_AT_MS = "at_ms"
  private const val TTL_MS = 30L * 60L * 1000L

  @Volatile
  private var memoryActive: Boolean = false

  @Volatile
  private var generation: Long = 0L

  /** Жылдам оқу (in-memory); persist тексеру үшін [isActive]. */
  var active: Boolean
    get() = memoryActive
    set(value) {
      memoryActive = value
    }

  fun currentGeneration(): Long = generation

  fun isGenerationCurrent(expected: Long): Boolean = generation == expected

  fun markActive(context: Context) {
    memoryActive = true
    try {
      context.applicationContext
        .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(KEY_ACTIVE, true)
        .putLong(KEY_AT_MS, System.currentTimeMillis())
        .apply()
    } catch (_: Throwable) {
      /* best effort */
    }
  }

  fun clear(context: Context) {
    memoryActive = false
    generation += 1L
    try {
      context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    } catch (_: Throwable) {
      /* best effort */
    }
  }

  fun isActive(context: Context?): Boolean {
    if (memoryActive) return true
    if (context == null) return false
    return try {
      val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      if (!prefs.getBoolean(KEY_ACTIVE, false)) return false
      val atMs = prefs.getLong(KEY_AT_MS, 0L)
      if (atMs > 0L && System.currentTimeMillis() - atMs > TTL_MS) {
        clear(context)
        return false
      }
      memoryActive = true
      true
    } catch (_: Throwable) {
      false
    }
  }
}
