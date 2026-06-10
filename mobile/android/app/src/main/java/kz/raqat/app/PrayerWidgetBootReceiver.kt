package kz.raqat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Жүйе қайта қосылғанда соңғы сақталған кестемен виджетті жаңарту. */
class PrayerWidgetBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
    val app = context.applicationContext
    PrayerWidgetViews.updateAllWidgets(app)
    PrayerWidgetAlarmScheduler.scheduleNext(app)
    PrayerAzanAlarmScheduler.restore(app)
    QiblaWidgetSensorService.ensureRunning(app)
  }
}
