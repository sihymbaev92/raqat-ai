package kz.raqat.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import java.net.URLEncoder

class PrayerAzanAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != PrayerAzanAlarmScheduler.ACTION_AZAN) return
    val app = context.applicationContext
    val label = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_LABEL).orEmpty().ifBlank { "Намаз" }
    val time = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_TIME).orEmpty()
    val soundId = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SOUND_ID).orEmpty().ifBlank { "adhan_haramain" }
    val salatKey = intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SALAT_KEY).orEmpty()
    val opened = openAzanActivityNow(app, label, time, soundId, salatKey)
    if (!opened) {
      showFullScreenAzanFallback(app, label, time, soundId, salatKey)
    }
  }

  private fun showFullScreenAzanFallback(
    context: Context,
    label: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    val mgr = context.getSystemService(NotificationManager::class.java) ?: return
    ensureChannel(mgr)
    val open = openAzanPendingIntent(context, label, time, soundId, salatKey)
    val title = context.getString(R.string.prayer_azan_fullscreen_title)
    val body = if (time.isBlank()) label else "$label: $time"
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.notification_icon)
      .setContentTitle(title)
      .setContentText(body)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(false)
      .setOngoing(false)
      .setSilent(true)
      .setSound(null)
      .setContentIntent(open)
      .setFullScreenIntent(open, true)
      .build()
    mgr.notify(NOTIFICATION_ID_BASE + kotlin.math.abs(salatKey.hashCode() % 1000), notification)
  }

  private fun openAzanActivityNow(
    context: Context,
    label: String,
    time: String,
    soundId: String,
    salatKey: String
  ): Boolean {
    return try {
      context.startActivity(azanActivityIntent(context, label, time, soundId, salatKey))
      true
    } catch (t: Throwable) {
      Log.w("PrayerAzanAlarm", "Direct azan activity launch failed; using full-screen fallback", t)
      false
    }
  }

  private fun openAzanPendingIntent(
    context: Context,
    label: String,
    time: String,
    soundId: String,
    salatKey: String
  ): PendingIntent {
    return PendingIntent.getActivity(
      context,
      REQUEST_OPEN_AZAN + kotlin.math.abs(salatKey.hashCode() % 1000),
      azanActivityIntent(context, label, time, soundId, salatKey),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun azanActivityIntent(
    context: Context,
    label: String,
    time: String,
    soundId: String,
    salatKey: String
  ): Intent {
    val uri = Uri.parse(
      "imamai://azan?label=${enc(label)}&time=${enc(time)}&soundId=${enc(soundId)}&salatKey=${enc(salatKey)}"
    )
    return Intent(Intent.ACTION_VIEW, uri, context, MainActivity::class.java).apply {
      flags =
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP or
          Intent.FLAG_ACTIVITY_NO_USER_ACTION
    }
  }

  private fun ensureChannel(mgr: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Намаз азаны",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Намаз уақыты кіргенде толық экран азан беті"
      setSound(null, null)
      enableVibration(false)
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    }
    mgr.createNotificationChannel(channel)
  }

  private fun enc(value: String): String = URLEncoder.encode(value, "UTF-8")

  companion object {
    private const val CHANNEL_ID = "prayer_azan_fullscreen_v2"
    private const val REQUEST_OPEN_AZAN = 90431
    private const val NOTIFICATION_ID_BASE = 904310
  }
}
