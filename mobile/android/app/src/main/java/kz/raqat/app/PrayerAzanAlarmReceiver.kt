package kz.raqat.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import java.net.URLEncoder

class PrayerAzanAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != PrayerAzanAlarmScheduler.ACTION_AZAN) return
    val label = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_LABEL).orEmpty().ifBlank { "Намаз" }
    val enteredTitle = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_ENTERED_TITLE)
      .orEmpty()
      .ifBlank { enteredTitleForLabel(label) }
    val time = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_TIME).orEmpty()
    val soundId = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SOUND_ID).orEmpty().ifBlank { "adhan_haramain" }
    val salatKey = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SALAT_KEY).orEmpty()
    val atMillis = intent.getLongExtra(PrayerAzanAlarmScheduler.EXTRA_AT_MILLIS, 0L)
    if (atMillis > 0L && System.currentTimeMillis() - atMillis > MAX_LATE_AZAN_MS) {
      Log.i("PrayerAzanAlarm", "Ignoring stale azan alarm for $salatKey")
      return
    }
    val pendingResult = goAsync()
    val app = context.applicationContext
    Handler(Looper.getMainLooper()).post {
      try {
        PrayerAzanNativePlayer.play(app, soundId)
        showAzanNotification(app, label, enteredTitle, time, soundId, salatKey)
        tryStartAzanActivity(app, label, enteredTitle, time, soundId, salatKey)
      } finally {
        Handler(Looper.getMainLooper()).postDelayed({ pendingResult.finish() }, 2500)
      }
    }
  }

  private fun tryStartAzanActivity(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    try {
      context.startActivity(azanActivityIntent(context, label, enteredTitle, time, soundId, salatKey))
      Log.i("PrayerAzanAlarm", "Started azan activity for $salatKey")
    } catch (t: Throwable) {
      Log.w("PrayerAzanAlarm", "Unable to start azan activity for $salatKey", t)
    }
  }

  private fun azanActivityIntent(
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
          Intent.FLAG_ACTIVITY_NO_USER_ACTION
    }
  }

  private fun showAzanNotification(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    val mgr = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    ensureChannel(mgr)
    val activityIntent = azanActivityIntent(context, label, enteredTitle, time, soundId, salatKey)
    val contentIntent = PendingIntent.getActivity(
      context,
      stableNotificationId("content-$salatKey-$time"),
      activityIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val fullScreenIntent = PendingIntent.getActivity(
      context,
      stableNotificationId("full-$salatKey-$time"),
      activityIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val body = if (time.isBlank()) "Азанды тоқтату үшін ашыңыз" else "$time · Азанды тоқтату үшін ашыңыз"
    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(context, AZAN_CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(context)
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
      Log.w("PrayerAzanAlarm", "Unable to show azan notification for $salatKey", t)
    }
  }

  private fun ensureChannel(mgr: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      AZAN_CHANNEL_ID,
      "Азан",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Намаз уақыты кіргенде азан экранын көрсету"
      setSound(null, null)
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 280, 180, 280)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    mgr.createNotificationChannel(channel)
  }

  private fun enteredTitleForLabel(label: String): String {
    return if (label.isBlank() || label == "Намаз") "Намаз уақыты кірді" else "$label намазы кірді"
  }

  private fun enc(value: String): String = URLEncoder.encode(value, "UTF-8")

  private fun stableNotificationId(value: String): Int {
    val raw = value.hashCode()
    return if (raw == Int.MIN_VALUE) 904221 else kotlin.math.abs(raw)
  }

  companion object {
    private const val AZAN_CHANNEL_ID = "raqat_native_azan_v2"
    private const val MAX_LATE_AZAN_MS = 5 * 60 * 1000L
  }
}
