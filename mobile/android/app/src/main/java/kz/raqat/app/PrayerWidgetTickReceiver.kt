package kz.raqat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** AlarmManager: виджет UI (келесі намаз) жаңарту; ауа райы — әр 10 мин Open-Meteo. */
class PrayerWidgetTickReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != PrayerWidgetAlarmScheduler.ACTION_TICK) return
    val app = context.applicationContext
    try {
      PrayerWidgetWeatherRefresh.refreshIfDue(app)
      PrayerWidgetViews.updateAllWidgets(app)
      PrayerWidgetAlarmScheduler.scheduleNext(app)
    } catch (_: Throwable) {
      /* виджет жаңарту */
    }
  }
}
