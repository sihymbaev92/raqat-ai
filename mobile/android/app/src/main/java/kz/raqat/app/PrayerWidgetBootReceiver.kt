package kz.raqat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Жүйе қайта қосылғанда / APK жаңарғанда соңғы кестемен виджет + азан оятқыштарын қалпына келтіру. */
class PrayerWidgetBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (
      action != Intent.ACTION_BOOT_COMPLETED &&
      action != Intent.ACTION_MY_PACKAGE_REPLACED &&
      action != Intent.ACTION_LOCKED_BOOT_COMPLETED &&
      action != "android.intent.action.QUICKBOOT_POWERON" &&
      action != "com.htc.intent.action.QUICKBOOT_POWERON"
    ) {
      return
    }
    val app = context.applicationContext
    PrayerAzanDeliveryService.stopRunning(app)
    // Ескі сессия/pending reboot кейін азанды қайта қоспасын — тек болашақ оятқыштар.
    try {
      PrayerAzanNativePlayer.stop()
    } catch (_: Throwable) {
      /* */
    }
    PrayerAzanActiveSession.clear(app)
    PrayerAzanPendingLaunch.clear(app)
    PrayerWidgetViews.updateAllWidgets(app)
    PrayerWidgetAlarmScheduler.scheduleNext(app)
    PrayerAzanAlarmScheduler.restore(app)
  }
}
