package kz.raqat.app

import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

object PrayerLegacyNotificationCleaner {
  private const val tag = "PrayerLegacyNotifCleaner"
  private const val legacyAzanNotificationIdStart = 904310
  private const val legacyAzanNotificationIdEnd = 905309
  /** 904224 — белсенді FSI азан хабарламасы; сессия кезінде өшірілмейді. */
  private const val ACTIVE_FSI_NOTIFICATION_ID = 904224
  private val nativeServiceNotificationIds = intArrayOf(904223, 904224)
  private val prayerKeys = arrayOf("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")
  private val legacyChannelIds = arrayOf(
    "raqat_native_azan_delivery_v1",
    "raqat_azan_fullscreen_v3",
    "raqat_azan_fullscreen_v2",
    "raqat_azan_fullscreen_v1",
    "prayer_azan_fullscreen_v2",
    "prayer_azan_fullscreen_v1",
    "prayer_azan_fullscreen",
    "prayer_v14_adhan_haramain",
    "prayer_v14_adhan_madina_clear",
    "prayer_v14_adhan_makkah_live",
    "prayer_v14_adhan_soft_cc0",
    "prayer_v14_adhan_takbir_high",
    "prayer_v14_off"
  )

  /**
   * Азан хабарламасыз режим: FSI 904224 да өшіріледі (сақталмайды).
   */
  fun clear(context: Context, preserveActiveAzanFsi: Boolean = false) {
    val mgr = context.applicationContext.getSystemService(NotificationManager::class.java) ?: return
    // preserveActiveAzanFsi енді елемейміз — хабарламасыз жеткізу.
    try {
      mgr.cancelAll()
      for (id in legacyAzanNotificationIdStart..legacyAzanNotificationIdEnd) {
        mgr.cancel(id)
      }
      for (id in nativeServiceNotificationIds) {
        mgr.cancel(id)
      }
      mgr.cancel(ACTIVE_FSI_NOTIFICATION_ID)
      clearExpoPrayerTags(mgr)
      deleteLegacyChannels(mgr)
      Log.i(tag, "Cleared legacy prayer notifications (keepFsi=false)")
    } catch (t: Throwable) {
      Log.w(tag, "Unable to clear legacy prayer notifications", t)
    }
  }

  /** Азан жеткізу кезінде — барлық азан хабарламаларын өшіру. */
  fun clearLegacyDuringAzanDelivery(context: Context) {
    clear(context, preserveActiveAzanFsi = false)
  }

  fun clearRepeatedly(context: Context) {
    val app = context.applicationContext
    clear(app, preserveActiveAzanFsi = false)
    val handler = Handler(Looper.getMainLooper())
    longArrayOf(1_000L, 5_000L, 15_000L).forEach { delayMs ->
      handler.postDelayed(
        { clear(app, preserveActiveAzanFsi = false) },
        delayMs
      )
    }
  }

  private fun clearExpoPrayerTags(mgr: NotificationManager) {
    val fmt = SimpleDateFormat("yyyyMMdd", Locale.US)
    val cal = Calendar.getInstance()
    cal.add(Calendar.DAY_OF_YEAR, -2)
    repeat(35) {
      val day = fmt.format(cal.time)
      for (key in prayerKeys) {
        mgr.cancel("raqat-prayer-v2-$day-$key", 0)
      }
      cal.add(Calendar.DAY_OF_YEAR, 1)
    }
  }

  private fun deleteLegacyChannels(mgr: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    for (channelId in legacyChannelIds) {
      mgr.deleteNotificationChannel(channelId)
    }
  }
}
