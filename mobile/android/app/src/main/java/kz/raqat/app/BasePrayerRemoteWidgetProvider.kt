package kz.raqat.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews

abstract class BasePrayerRemoteWidgetProvider : AppWidgetProvider() {
  abstract fun buildViews(context: Context): RemoteViews

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    val views = buildViews(context)
    for (id in appWidgetIds) {
      appWidgetManager.updateAppWidget(id, views)
    }
    PrayerWidgetAlarmScheduler.scheduleNext(context.applicationContext)
  }

  override fun onEnabled(context: Context) {
    PrayerWidgetAlarmScheduler.scheduleNext(context.applicationContext)
  }

  override fun onDisabled(context: Context) {
    val mgr = AppWidgetManager.getInstance(context)
    val anyLeft =
      mgr.getAppWidgetIds(ComponentName(context, PrayerHomeStripWidgetProvider::class.java)).isNotEmpty()
    if (!anyLeft) {
      PrayerWidgetAlarmScheduler.cancel(context.applicationContext)
    }
    QiblaWidgetSensorService.stopIfIdle(context.applicationContext)
  }
}
