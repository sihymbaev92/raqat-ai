package kz.raqat.app

import android.content.Context
import android.widget.RemoteViews

class PrayerHomeStripWidgetProvider : BasePrayerRemoteWidgetProvider() {
  override fun buildViews(context: Context): RemoteViews =
    PrayerWidgetViews.buildHomeStripRemoteViews(context)
}
