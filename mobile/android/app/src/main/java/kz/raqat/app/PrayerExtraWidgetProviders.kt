package kz.raqat.app

import android.content.Context
import android.widget.RemoteViews
import android.appwidget.AppWidgetManager

class PrayerHomeStripWidgetProvider : BasePrayerRemoteWidgetProvider() {
  override fun buildViews(context: Context): RemoteViews =
    PrayerWidgetViews.buildHomeStripRemoteViews(context)

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)
    QiblaWidgetSensorService.ensureRunning(context)
  }

  override fun onEnabled(context: Context) {
    super.onEnabled(context)
    QiblaWidgetSensorService.ensureRunning(context)
  }

  override fun onDisabled(context: Context) {
    super.onDisabled(context)
    QiblaWidgetSensorService.stopIfIdle(context)
  }
}
