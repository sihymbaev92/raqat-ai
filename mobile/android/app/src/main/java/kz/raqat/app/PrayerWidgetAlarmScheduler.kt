package kz.raqat.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Виджетті JS іске қосылмай-ақ жаңарту: сағат/кері санақ мәтіні әр минут сайын.
 */
object PrayerWidgetAlarmScheduler {
  const val ACTION_TICK = "kz.raqat.app.action.PRAYER_WIDGET_TICK"
  private const val REQUEST_CODE = 90421
  /** 1 мин — сағат жолы + chronometer базасын синхрондау */
  private const val INTERVAL_MS = 60L * 1000L

  fun scheduleNext(context: Context) {
    val app = context.applicationContext
    val am = app.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val intent = Intent(app, PrayerWidgetTickReceiver::class.java).apply {
      action = ACTION_TICK
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val pi = PendingIntent.getBroadcast(app, REQUEST_CODE, intent, flags)
    val triggerAt = System.currentTimeMillis() + INTERVAL_MS
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
    } else {
      @Suppress("DEPRECATION")
      am.set(AlarmManager.RTC_WAKEUP, triggerAt, pi)
    }
  }

  fun cancel(context: Context) {
    val app = context.applicationContext
    val am = app.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val intent = Intent(app, PrayerWidgetTickReceiver::class.java).apply {
      action = ACTION_TICK
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val pi = PendingIntent.getBroadcast(app, REQUEST_CODE, intent, flags)
    am.cancel(pi)
  }
}
