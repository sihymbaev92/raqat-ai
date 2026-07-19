package kz.raqat.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import java.net.URLEncoder
import org.json.JSONArray
import org.json.JSONObject

object PrayerAzanAlarmScheduler {
  data class ScheduleResult(
    val scheduledCount: Int,
    val identifiers: List<String>,
    val exactAlarmPermissionGranted: Boolean
  )

  const val ACTION_AZAN = "kz.raqat.app.action.PRAYER_AZAN_FULLSCREEN"
  const val EXTRA_LABEL = "label"
  const val EXTRA_ENTERED_TITLE = "enteredTitle"
  const val EXTRA_TIME = "time"
  const val EXTRA_SOUND_ID = "soundId"
  const val EXTRA_SALAT_KEY = "salatKey"
  const val EXTRA_AT_MILLIS = "atMillis"

  private const val PREFS = "raqat_prayer_azan_alarm"
  private const val KEY_REQUEST_CODES = "request_codes"
  private const val KEY_LAST_JSON = "last_json"

  fun scheduleFromJson(context: Context, json: String): ScheduleResult {
    val app = context.applicationContext
    cancelAll(app)
    app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_LAST_JSON, json)
      .apply()
    return scheduleParsed(app, json)
  }

  fun restore(context: Context) {
    val app = context.applicationContext
    val json = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_LAST_JSON, null) ?: return
    cancelPendingIntentsOnly(app)
    scheduleParsed(app, json)
  }

  /** QA: бір реттік locked-screen azan тесті (15–600 сек). */
  fun scheduleTestAlarm(context: Context, delaySeconds: Int): ScheduleResult {
    val delay = delaySeconds.coerceIn(15, 600)
    val atMillis = System.currentTimeMillis() + delay * 1000L
    val item = JSONObject()
      .put("identifier", "raqat-azan-qa-test")
      .put("atMillis", atMillis)
      .put("label", "Екінті")
      .put("enteredTitle", "Екінті намазы кірді (QA)")
      .put("timeShort", "QA")
      .put("soundId", "adhan_haramain")
      .put("salatKey", "asr")
    val json = JSONArray().put(item).toString()
    return scheduleFromJson(context, json)
  }

  private fun scheduleParsed(app: Context, json: String): ScheduleResult {
    val arr = JSONArray(json)
    val requestCodes = JSONArray()
    val identifiers = mutableListOf<String>()
    val exactAlarmPermissionGranted = canScheduleExactAlarms(app)
    for (i in 0 until arr.length()) {
      val item = arr.optJSONObject(i) ?: continue
      val atMillis = item.optLong("atMillis", 0L)
      if (atMillis <= System.currentTimeMillis()) continue
      val identifier = item.optString("identifier", "raqat-prayer-$i")
      val requestCode = stableRequestCode(identifier)
      val pi = pendingIntent(app, requestCode, item)
      val am = app.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: continue
      try {
        when {
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && exactAlarmPermissionGranted -> {
            am.setAlarmClock(
              AlarmManager.AlarmClockInfo(
                atMillis,
                openActivityPendingIntent(app, stableRequestCode("open-$identifier"), item)
              ),
              pi
            )
          }
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && exactAlarmPermissionGranted -> {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pi)
          }
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.M -> {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pi)
          }
          else -> {
            @Suppress("DEPRECATION")
            am.setExact(AlarmManager.RTC_WAKEUP, atMillis, pi)
          }
        }
      } catch (_: SecurityException) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pi)
        } else {
          @Suppress("DEPRECATION")
          am.set(AlarmManager.RTC_WAKEUP, atMillis, pi)
        }
      }
      requestCodes.put(requestCode)
      identifiers.add(identifier)
    }
    app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_REQUEST_CODES, requestCodes.toString())
      .apply()
    return ScheduleResult(
      identifiers.size,
      identifiers,
      exactAlarmPermissionGranted
    )
  }

  fun canScheduleExactAlarms(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    val am = context.applicationContext.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
    return am?.canScheduleExactAlarms() == true
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
    val defaultLabel = context.getString(R.string.prayer_azan_default_label)
    val enteredDefault = context.getString(R.string.prayer_azan_fullscreen_title)
    val intent = Intent(context, PrayerAzanAlarmReceiver::class.java).apply {
      action = ACTION_AZAN
      putExtra(EXTRA_LABEL, item.optString("label", defaultLabel))
      putExtra(EXTRA_ENTERED_TITLE, item.optString("enteredTitle", enteredDefault))
      putExtra(EXTRA_TIME, item.optString("timeShort", ""))
      putExtra(EXTRA_SOUND_ID, item.optString("soundId", "adhan_haramain"))
      putExtra(EXTRA_SALAT_KEY, item.optString("salatKey", ""))
      putExtra(EXTRA_AT_MILLIS, item.optLong("atMillis", 0L))
    }
    return PendingIntent.getBroadcast(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun openActivityPendingIntent(context: Context, requestCode: Int, item: JSONObject): PendingIntent {
    val defaultLabel = context.getString(R.string.prayer_azan_default_label)
    val label = item.optString("label", defaultLabel)
    val enteredTitle = item.optString("enteredTitle", enteredTitleForLabel(context, label))
    val time = item.optString("timeShort", "")
    val soundId = item.optString("soundId", "adhan_haramain")
    val salatKey = item.optString("salatKey", "")
    val intent = PrayerAzanDelivery.azanActivityIntent(context, label, enteredTitle, time, soundId, salatKey)
    return PendingIntent.getActivity(
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

  private fun enc(value: String): String = URLEncoder.encode(value, "UTF-8")

  private fun enteredTitleForLabel(context: Context, label: String): String {
    val defaultLabel = context.getString(R.string.prayer_azan_default_label)
    return if (label.isBlank() || label == defaultLabel) {
      context.getString(R.string.prayer_azan_fullscreen_title)
    } else {
      context.getString(R.string.prayer_azan_entered_for_label, label)
    }
  }
}
