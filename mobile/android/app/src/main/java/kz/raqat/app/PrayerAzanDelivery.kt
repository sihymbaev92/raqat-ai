package kz.raqat.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import java.net.URLEncoder

/** Shared azan delivery: fullScreenIntent + MainActivity deep link → PrayerAzanScreen (RN). */
object PrayerAzanDelivery {
  private const val AZAN_CHANNEL_ID = "raqat_native_azan_v2"
  private const val TAG = "PrayerAzanDelivery"

  fun azanActivityIntent(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ): Intent {
    val uri = Uri.parse(
      "imamai://azan?label=${enc(label)}&enteredTitle=${enc(enteredTitle)}&time=${enc(time)}&soundId=${enc(soundId)}&salatKey=${enc(salatKey)}&nativeAudio=1"
    )
    return Intent(Intent.ACTION_VIEW, uri, context, MainActivity::class.java).apply {
      flags =
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP or
          Intent.FLAG_ACTIVITY_NO_USER_ACTION or
          Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
    }
  }

  fun tryStartAzanActivity(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String,
    retryAfterMs: Long = 450L
  ) {
    val app = context.applicationContext
    val launch = {
      try {
        app.startActivity(azanActivityIntent(app, label, enteredTitle, time, soundId, salatKey))
        Log.i(TAG, "Started azan activity for $salatKey")
      } catch (t: Throwable) {
        Log.w(TAG, "Unable to start azan activity for $salatKey", t)
      }
    }
    launch()
    if (retryAfterMs > 0L) {
      Handler(Looper.getMainLooper()).postDelayed({ launch() }, retryAfterMs)
    }
  }

  fun showAzanNotification(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    val app = context.applicationContext
    val mgr = app.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    ensureChannel(mgr)
    val activityIntent = azanActivityIntent(app, label, enteredTitle, time, soundId, salatKey)
    val contentIntent = PendingIntent.getActivity(
      app,
      stableNotificationId("content-$salatKey-$time"),
      activityIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val fullScreenIntent = PendingIntent.getActivity(
      app,
      stableNotificationId("full-$salatKey-$time"),
      activityIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val body = if (time.isBlank()) "Азан мәтіні · ашу үшін басыңыз" else "$time · Азан мәтіні"
    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(app, AZAN_CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(app)
      }
    val notification = builder
      .setSmallIcon(R.drawable.notification_icon)
      .setContentTitle(enteredTitle)
      .setContentText(body)
      .setContentIntent(contentIntent)
      .setFullScreenIntent(fullScreenIntent, true)
      .setCategory(Notification.CATEGORY_ALARM)
      .setPriority(Notification.PRIORITY_MAX)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setAutoCancel(true)
      .setOngoing(false)
      .setShowWhen(true)
      .setWhen(System.currentTimeMillis())
      .setSound(null)
      .build()

    try {
      mgr.notify(stableNotificationId("azan-$salatKey-$time"), notification)
    } catch (t: Throwable) {
      Log.w(TAG, "Unable to show azan notification for $salatKey", t)
    }
  }

  fun acquireAzanWakeLock(context: Context): PowerManager.WakeLock? {
    val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return null
    return try {
      pm.newWakeLock(
        PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
        "raqat:PrayerAzanWake"
      ).apply {
        setReferenceCounted(false)
        acquire(15_000L)
      }
    } catch (t: Throwable) {
      Log.w(TAG, "Unable to acquire azan wake lock", t)
      null
    }
  }

  /** Alarm receiver fallback when foreground service cannot start. */
  fun startInlineFallback(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    val app = context.applicationContext
    val wakeLock = acquireAzanWakeLock(app)
    try {
      if (soundId != "off") {
        PrayerAzanNativePlayer.play(app, soundId)
      }
      showAzanNotification(app, label, enteredTitle, time, soundId, salatKey)
      tryStartAzanActivity(app, label, enteredTitle, time, soundId, salatKey)
    } finally {
      Handler(Looper.getMainLooper()).postDelayed({
        try {
          if (wakeLock?.isHeld == true) wakeLock.release()
        } catch (_: Throwable) {
          /* best effort */
        }
      }, 2800L)
    }
  }

  private fun ensureChannel(mgr: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      AZAN_CHANNEL_ID,
      "Азан",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Намаз уақыты кіргенде азан экранын автоматты көрсету"
      setSound(null, null)
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 280, 180, 280)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setBypassDnd(true)
    }
    mgr.createNotificationChannel(channel)
  }

  private fun enc(value: String): String = URLEncoder.encode(value, "UTF-8")

  private fun stableNotificationId(value: String): Int {
    val raw = value.hashCode()
    return if (raw == Int.MIN_VALUE) 904221 else kotlin.math.abs(raw)
  }
}
