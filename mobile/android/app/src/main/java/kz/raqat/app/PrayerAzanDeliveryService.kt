package kz.raqat.app

import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log

/**
 * Legacy entry — FGS хабарландыруы Samsung-та бос «RAHAT OMIR» ретінде көрінген.
 * Азан енді тікелей [PrayerAzanDelivery.deliverAzan] арқылы жіберіледі.
 */
class PrayerAzanDeliveryService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action != ACTION_DELIVER) {
      stopSelf()
      return START_NOT_STICKY
    }
    val label = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_LABEL).orEmpty().ifBlank { "Намаз" }
    val enteredTitle = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_ENTERED_TITLE)
      .orEmpty()
      .ifBlank { enteredTitleForLabel(label) }
    val time = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_TIME).orEmpty()
    val soundId = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SOUND_ID).orEmpty().ifBlank { "adhan_haramain" }
    val salatKey = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SALAT_KEY).orEmpty()

    try {
      PrayerAzanDelivery.deliverAzan(this, label, enteredTitle, time, soundId, salatKey)
    } catch (t: Throwable) {
      Log.w(TAG, "Legacy service deliver failed for $salatKey", t)
    } finally {
      stopRunning(applicationContext)
      stopSelf()
    }
    return START_NOT_STICKY
  }

  companion object {
    private const val TAG = "PrayerAzanDelivery"
    const val ACTION_DELIVER = "kz.raqat.app.action.PRAYER_AZAN_DELIVER"
    private const val CHANNEL_ID = "raqat_native_azan_delivery_v1"
    private const val NOTIFICATION_ID = 904223

    fun start(
      context: Context,
      label: String,
      enteredTitle: String,
      time: String,
      soundId: String,
      salatKey: String
    ) {
      PrayerAzanDelivery.deliverAzan(context, label, enteredTitle, time, soundId, salatKey)
    }

    fun stopRunning(context: Context) {
      val app = context.applicationContext
      try {
        app.stopService(Intent(app, PrayerAzanDeliveryService::class.java))
      } catch (_: Throwable) {
        /* */
      }
      try {
        val mgr = app.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        mgr.cancel(NOTIFICATION_ID)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          mgr.deleteNotificationChannel(CHANNEL_ID)
        }
      } catch (_: Throwable) {
        /* */
      }
    }

    private fun enteredTitleForLabel(label: String): String {
      return if (label.isBlank() || label == "Намаз") "Намаз уақыты кірді" else "$label намазы кірді"
    }
  }
}
