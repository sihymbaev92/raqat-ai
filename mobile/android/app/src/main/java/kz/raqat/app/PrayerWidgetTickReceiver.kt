package kz.raqat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** AlarmManager: виджет UI (келесі намаз) жаңарту; кесте желіден JS/background fetch арқылы жаңарады. */
class PrayerWidgetTickReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != PrayerWidgetAlarmScheduler.ACTION_TICK) return
    val app = context.applicationContext
    try {
      PrayerWidgetViews.updateAllWidgets(app)
      QiblaWidgetSensorService.ensureRunning(app)
      PrayerWidgetAlarmScheduler.scheduleNext(app)
    } catch (_: Throwable) {
      /* виджет жаңарту */
    }
  }
}
