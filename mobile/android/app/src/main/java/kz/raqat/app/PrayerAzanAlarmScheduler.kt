package kz.raqat.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject

object PrayerAzanAlarmScheduler {
  const val ACTION_AZAN = "kz.raqat.app.action.PRAYER_AZAN_FULLSCREEN"
  const val EXTRA_LABEL = "label"
  const val EXTRA_TIME = "time"
  const val EXTRA_SOUND_ID = "soundId"
  const val EXTRA_SALAT_KEY = "salatKey"

  private const val PREFS = "raqat_prayer_azan_alarm"
  private const val KEY_REQUEST_CODES = "request_codes"
  private const val KEY_LAST_JSON = "last_json"

  fun scheduleFromJson(context: Context, json: String) {
    val app = context.applicationContext
    cancelAll(app)
    app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_LAST_JSON, json)
      .apply()
    scheduleParsed(app, json)
  }

  fun restore(context: Context) {
    val app = context.applicationContext
    val json = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_LAST_JSON, null) ?: return
    cancelPendingIntentsOnly(app)
    scheduleParsed(app, json)
  }

  private fun scheduleParsed(app: Context, json: String) {
    val arr = JSONArray(json)
    val requestCodes = JSONArray()
    for (i in 0 until arr.length()) {
      val item = arr.optJSONObject(i) ?: continue
      val atMillis = item.optLong("atMillis", 0L)
      if (atMillis <= System.currentTimeMillis()) continue
      val identifier = item.optString("identifier", "raqat-prayer-$i")
      val requestCode = stableRequestCode(identifier)
      val pi = pendingIntent(app, requestCode, item)
      val am = app.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: continue
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pi)
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pi)
      } else {
        @Suppress("DEPRECATION")
        am.setExact(AlarmManager.RTC_WAKEUP, atMillis, pi)
      }
      requestCodes.put(requestCode)
    }
    app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_REQUEST_CODES, requestCodes.toString())
      .apply()
  }

  fun cancelAll(context: Context) {
    cancelPendingIntentsOnly(context)
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(KEY_LAST_JSON)
      .apply()
  }

  private fun cancelPendingIntentsOnly(context: Context) {
    val app = context.applicationContext
    val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_REQUEST_CODES, "[]") ?: "[]"
    val am = app.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
    try {
      val arr = JSONArray(raw)
      for (i in 0 until arr.length()) {
        val requestCode = arr.optInt(i)
        if (requestCode != 0) {
          am?.cancel(emptyPendingIntent(app, requestCode))
        }
      }
    } catch (_: Throwable) {
      /* ignore corrupt prefs */
    }
    prefs.edit().remove(KEY_REQUEST_CODES).apply()
  }

  private fun pendingIntent(context: Context, requestCode: Int, item: JSONObject): PendingIntent {
    val intent = Intent(context, PrayerAzanAlarmReceiver::class.java).apply {
      action = ACTION_AZAN
      putExtra(EXTRA_LABEL, item.optString("label", "Намаз"))
      putExtra(EXTRA_TIME, item.optString("timeShort", ""))
      putExtra(EXTRA_SOUND_ID, item.optString("soundId", "adhan_haramain"))
      putExtra(EXTRA_SALAT_KEY, item.optString("salatKey", ""))
    }
    return PendingIntent.getBroadcast(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun emptyPendingIntent(context: Context, requestCode: Int): PendingIntent {
    val intent = Intent(context, PrayerAzanAlarmReceiver::class.java).apply { action = ACTION_AZAN }
    return PendingIntent.getBroadcast(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun stableRequestCode(identifier: String): Int {
    val raw = identifier.hashCode()
    return if (raw == Int.MIN_VALUE) 904220 else kotlin.math.abs(raw)
  }
}
