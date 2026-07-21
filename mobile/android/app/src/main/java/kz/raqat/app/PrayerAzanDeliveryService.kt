package kz.raqat.app

import android.app.Notification
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log

/**
 * Foreground service: FSI notification + overlay/LockActivity + дыбыс (тек UI көрінгенде).
 */
class PrayerAzanDeliveryService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action != ACTION_DELIVER) {
      stopSelf()
      return START_NOT_STICKY
    }
    val app = applicationContext
    val defaultLabel = app.getString(R.string.prayer_azan_default_label)
    val label = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_LABEL).orEmpty().ifBlank { defaultLabel }
    val enteredTitle =
      intent
        .getStringExtra(PrayerAzanAlarmScheduler.EXTRA_ENTERED_TITLE)
        .orEmpty()
        .ifBlank { enteredTitleForLabel(app, label) }
    val time = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_TIME).orEmpty()
    val soundId =
      intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SOUND_ID).orEmpty().ifBlank { "adhan_haramain" }
    val salatKey = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SALAT_KEY).orEmpty()

    try {
      PrayerAzanActiveSession.markActive(app)
      PrayerAzanPendingLaunch.save(app, label, enteredTitle, time, soundId, salatKey)
      val notification =
        PrayerAzanDelivery.buildAzanNotification(app, label, enteredTitle, time, soundId, salatKey)
      promoteToForeground(notification)

      val skipUi = intent.getBooleanExtra(EXTRA_SKIP_UI_LAUNCH, false)
      if (skipUi) {
        // LockActivity / AlarmClock беті әлдеқашан ашық — FSI heads-up жасыру.
        PrayerAzanDelivery.scheduleSuppressAzanHeadsUp(app)
        Log.i(TAG, "Foreground azan notification only for $salatKey")
        return START_STICKY
      }

      // FGS контекстінен overlay — Broadcast-тан сенімдірек (Honor).
      val overlayOk = PrayerAzanOverlay.show(app, label, enteredTitle, time, soundId, salatKey)
      if (!overlayOk) {
        PrayerAzanDelivery.tryStartAzanScreens(app, label, enteredTitle, time, soundId, salatKey)
        Handler(Looper.getMainLooper()).postDelayed(
          {
            if (!PrayerAzanActiveSession.isActive(app)) return@postDelayed
            if (PrayerAzanOverlay.isShowing()) return@postDelayed
            PrayerAzanDelivery.tryStartAzanLockFallback(app, label, enteredTitle, time, soundId, salatKey)
            PrayerAzanOverlay.show(app, label, enteredTitle, time, soundId, salatKey)
          },
          1_200L
        )
      }

      PrayerAzanDelivery.scheduleAzanActivityLaunches(app, label, enteredTitle, time, soundId, salatKey)
      PrayerAzanDelivery.scheduleSuppressAzanHeadsUp(app)
      Log.i(TAG, "Foreground azan UI running for $salatKey overlay=$overlayOk")
    } catch (t: Throwable) {
      Log.w(TAG, "Foreground azan delivery failed for $salatKey", t)
      try {
        PrayerAzanDelivery.deliverAzan(app, label, enteredTitle, time, soundId, salatKey)
      } catch (t2: Throwable) {
        Log.w(TAG, "Inline fallback also failed for $salatKey", t2)
        stopSelf()
      }
    }
    return START_STICKY
  }

  private fun promoteToForeground(notification: Notification) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        PrayerAzanDelivery.FSI_NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
      )
    } else {
      startForeground(PrayerAzanDelivery.FSI_NOTIFICATION_ID, notification)
    }
  }

  companion object {
    private const val TAG = "PrayerAzanDelivery"
    const val ACTION_DELIVER = "kz.raqat.app.action.PRAYER_AZAN_DELIVER"
    const val EXTRA_SKIP_UI_LAUNCH = "skipUiLaunch"

    fun start(
      context: Context,
      label: String,
      enteredTitle: String,
      time: String,
      soundId: String,
      salatKey: String,
      skipUiLaunch: Boolean = false
    ) {
      val app = context.applicationContext
      val intent =
        Intent(app, PrayerAzanDeliveryService::class.java).apply {
          action = ACTION_DELIVER
          putExtra(PrayerAzanAlarmScheduler.EXTRA_LABEL, label)
          putExtra(PrayerAzanAlarmScheduler.EXTRA_ENTERED_TITLE, enteredTitle)
          putExtra(PrayerAzanAlarmScheduler.EXTRA_TIME, time)
          putExtra(PrayerAzanAlarmScheduler.EXTRA_SOUND_ID, soundId)
          putExtra(PrayerAzanAlarmScheduler.EXTRA_SALAT_KEY, salatKey)
          putExtra(EXTRA_SKIP_UI_LAUNCH, skipUiLaunch)
        }
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          app.startForegroundService(intent)
        } else {
          app.startService(intent)
        }
      } catch (t: Throwable) {
        Log.w(TAG, "startForegroundService failed — inline deliver", t)
        PrayerAzanDelivery.deliverAzan(app, label, enteredTitle, time, soundId, salatKey)
      }
    }

    fun stopRunning(context: Context) {
      val app = context.applicationContext
      try {
        app.stopService(Intent(app, PrayerAzanDeliveryService::class.java))
      } catch (_: Throwable) {
        /* */
      }
    }

    private fun enteredTitleForLabel(context: Context, label: String): String {
      val defaultLabel = context.getString(R.string.prayer_azan_default_label)
      return if (label.isBlank() || label == defaultLabel) {
        context.getString(R.string.prayer_azan_fullscreen_title)
      } else {
        context.getString(R.string.prayer_azan_entered_for_label, label)
      }
    }
  }
}
