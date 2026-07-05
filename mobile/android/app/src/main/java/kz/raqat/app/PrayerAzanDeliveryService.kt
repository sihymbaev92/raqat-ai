package kz.raqat.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log

/**
 * OEM (Samsung/Xiaomi) фон шектеуінде azan сенімді жеткізу:
 * WakeLock + foreground + fullScreenIntent → MainActivity (imamai://azan) → PrayerAzanScreen.
 */
class PrayerAzanDeliveryService : Service() {
  private var wakeLock: PowerManager.WakeLock? = null

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

    acquireWakeLock()
    val activityIntent = PrayerAzanDelivery.azanActivityIntent(this, label, enteredTitle, time, soundId, salatKey)
    val notification = buildForegroundNotification(enteredTitle, time, salatKey, activityIntent)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
      } else {
        @Suppress("DEPRECATION")
        startForeground(NOTIFICATION_ID, notification)
      }
    } catch (t: Throwable) {
      Log.w(TAG, "startForeground failed; inline fallback for $salatKey", t)
      releaseWakeLock()
      PrayerAzanDelivery.startInlineFallback(this, label, enteredTitle, time, soundId, salatKey)
      stopSelf()
      return START_NOT_STICKY
    }

    if (soundId != "off") {
      PrayerAzanNativePlayer.play(applicationContext, soundId)
    }
    PrayerAzanDelivery.tryStartAzanActivity(this, label, enteredTitle, time, soundId, salatKey)

    Handler(Looper.getMainLooper()).postDelayed({
      releaseWakeLock()
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
    }, STOP_AFTER_MS)
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    releaseWakeLock()
    super.onDestroy()
  }

  private fun acquireWakeLock() {
    try {
      val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return
      wakeLock =
        pm.newWakeLock(
          PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
          "raqat:PrayerAzanDelivery"
        ).apply {
          setReferenceCounted(false)
          acquire(WAKE_LOCK_MS)
        }
    } catch (t: Throwable) {
      Log.w(TAG, "WakeLock acquire failed", t)
    }
  }

  private fun releaseWakeLock() {
    try {
      wakeLock?.let {
        if (it.isHeld) it.release()
      }
    } catch (_: Throwable) {
      /* */
    }
    wakeLock = null
  }

  private fun buildForegroundNotification(
    enteredTitle: String,
    time: String,
    salatKey: String,
    activityIntent: Intent
  ): Notification {
    val mgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    ensureChannel(mgr)
    val fullScreenIntent = PendingIntent.getActivity(
      this,
      stableNotificationId("fsi-$salatKey-$time"),
      activityIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val contentIntent = PendingIntent.getActivity(
      this,
      stableNotificationId("content-$salatKey-$time"),
      activityIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val body = if (time.isBlank()) "Азанды тоқтату үшін ашыңыз" else "$time · Азанды тоқтату үшін ашыңыз"
    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(this, CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(this)
      }
    return builder
      .setSmallIcon(R.drawable.notification_icon)
      .setContentTitle(enteredTitle)
      .setContentText(body)
      .setContentIntent(contentIntent)
      .setFullScreenIntent(fullScreenIntent, true)
      .setCategory(Notification.CATEGORY_ALARM)
      .setPriority(Notification.PRIORITY_MAX)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setWhen(System.currentTimeMillis())
      .setSound(null)
      .build()
  }

  private fun ensureChannel(mgr: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Азан (фон)",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Құлыпта толық экран азан — OEM фон режимі"
      setSound(null, null)
      enableVibration(true)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setBypassDnd(true)
    }
    mgr.createNotificationChannel(channel)
  }

  companion object {
    private const val TAG = "PrayerAzanDelivery"
    const val ACTION_DELIVER = "kz.raqat.app.action.PRAYER_AZAN_DELIVER"
    private const val CHANNEL_ID = "raqat_native_azan_delivery_v1"
    private const val NOTIFICATION_ID = 904223
    private const val WAKE_LOCK_MS = 3 * 60 * 1000L
    private const val STOP_AFTER_MS = 90_000L

    fun start(
      context: Context,
      label: String,
      enteredTitle: String,
      time: String,
      soundId: String,
      salatKey: String
    ) {
      val app = context.applicationContext
      val intent = Intent(app, PrayerAzanDeliveryService::class.java).apply {
        action = ACTION_DELIVER
        putExtra(PrayerAzanAlarmScheduler.EXTRA_LABEL, label)
        putExtra(PrayerAzanAlarmScheduler.EXTRA_ENTERED_TITLE, enteredTitle)
        putExtra(PrayerAzanAlarmScheduler.EXTRA_TIME, time)
        putExtra(PrayerAzanAlarmScheduler.EXTRA_SOUND_ID, soundId)
        putExtra(PrayerAzanAlarmScheduler.EXTRA_SALAT_KEY, salatKey)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        app.startForegroundService(intent)
      } else {
        app.startService(intent)
      }
    }

    private fun enteredTitleForLabel(label: String): String {
      return if (label.isBlank() || label == "Намаз") "Намаз уақыты кірді" else "$label намазы кірді"
    }

    private fun stableNotificationId(value: String): Int {
      val raw = value.hashCode()
      return if (raw == Int.MIN_VALUE) 904224 else kotlin.math.abs(raw)
    }
  }
}
