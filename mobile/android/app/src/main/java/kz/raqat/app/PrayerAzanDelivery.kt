package kz.raqat.app

import android.app.ActivityOptions
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
import android.provider.Settings
import android.util.Log
import java.net.URLEncoder

/**
 * Азан жеткізу: fullScreenIntent хабарландыруы (құлып экраны) + тікелей
 * MainActivity → PrayerAzanScreen (best-effort).
 */
object PrayerAzanDelivery {
  private const val AZAN_CHANNEL_ID = "raqat_native_azan_v4"
  private const val TAG = "PrayerAzanDelivery"
  private const val FSI_NOTIFICATION_ID = 904224

  /** MainActivity құлып экраны flag-тары — тек осы extras бар intent. */
  const val EXTRA_AZAN_TRUSTED = "kz.raqat.app.AZAN_TRUSTED"

  /** Intent flags — Activity API 29+ атаулары кей SDK-да жоқ болуы мүмкін. */
  private const val FLAG_SHOW_WHEN_LOCKED = 0x00080000
  private const val FLAG_TURN_SCREEN_ON = 0x00200000

  @Volatile
  private var heldWakeLock: PowerManager.WakeLock? = null

  fun azanActivityIntent(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ): Intent {
    val uri = Uri.parse(
      "raqat://azan?label=${enc(label)}&enteredTitle=${enc(enteredTitle)}&time=${enc(time)}&soundId=${enc(soundId)}&salatKey=${enc(salatKey)}&nativeAudio=1"
    )
    var launchFlags =
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_CLEAR_TOP or
        Intent.FLAG_ACTIVITY_SINGLE_TOP or
        Intent.FLAG_ACTIVITY_NO_USER_ACTION or
        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
        FLAG_SHOW_WHEN_LOCKED or
        FLAG_TURN_SCREEN_ON
    return Intent(Intent.ACTION_VIEW, uri, context, MainActivity::class.java).apply {
      putExtra(EXTRA_AZAN_TRUSTED, true)
      flags = launchFlags
    }
  }

  private val AZAN_LAUNCH_RETRY_MS =
    longArrayOf(0L, 400L, 1_000L, 2_000L, 4_000L, 8_000L, 15_000L, 30_000L, 45_000L, 60_000L, 90_000L)

  fun tryStartAzanActivity(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    val app = context.applicationContext
    val intent = azanActivityIntent(app, label, enteredTitle, time, soundId, salatKey)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val opts =
          ActivityOptions.makeBasic().apply {
            setPendingIntentBackgroundActivityStartMode(
              ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED
            )
          }
        context.startActivity(intent, opts.toBundle())
      } else {
        context.startActivity(intent)
      }
      Log.i(TAG, "Started azan activity for $salatKey")
    } catch (t: Throwable) {
      Log.w(TAG, "Unable to start azan activity for $salatKey", t)
    }
  }

  /** Фон/құлып экраны: бірнеше рет қайталау — FSI + Activity бірге. */
  fun scheduleAzanActivityLaunches(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    val handler = Handler(Looper.getMainLooper())
    for (delay in AZAN_LAUNCH_RETRY_MS) {
      handler.postDelayed(
        {
          if (!PrayerAzanActiveSession.isActive(context)) return@postDelayed
          tryStartAzanActivity(context, label, enteredTitle, time, soundId, salatKey)
        },
        delay
      )
    }
  }

  fun canUseFullScreenIntent(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return true
    return try {
      val mgr = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      mgr?.canUseFullScreenIntent() == true
    } catch (_: Throwable) {
      false
    }
  }

  fun openFullScreenIntentSettings(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return false
    return try {
      val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      true
    } catch (t: Throwable) {
      Log.w(TAG, "Unable to open full-screen intent settings", t)
      try {
        val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.parse("package:${context.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(fallback)
        true
      } catch (t2: Throwable) {
        Log.w(TAG, "Unable to open app details for FSI", t2)
        false
      }
    }
  }

  /**
   * Құлып экранындағы негізгі жол: CATEGORY_ALARM + setFullScreenIntent.
   * Android 14+ FSI рұқсаты жабық болса да content notification қалады (тап → ашу).
   */
  fun showAzanFullScreenNotification(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    val app = context.applicationContext
    val mgr = app.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    ensureChannel(app, mgr)
    val activityIntent = azanActivityIntent(app, label, enteredTitle, time, soundId, salatKey)
    val piFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val contentIntent =
      PendingIntent.getActivity(app, stableNotificationId("content-$salatKey-$time"), activityIntent, piFlags)
    val fullScreenIntent =
      PendingIntent.getActivity(app, stableNotificationId("full-$salatKey-$time"), activityIntent, piFlags)

    val defaultLabel = app.getString(R.string.prayer_azan_default_label)
    val title = enteredTitle.ifBlank { label }.ifBlank { defaultLabel }
    val fsiAllowed = canUseFullScreenIntent(app)
    val body =
      when {
        !fsiAllowed && time.isBlank() -> app.getString(R.string.prayer_azan_notif_body_fsi_denied)
        !fsiAllowed -> app.getString(R.string.prayer_azan_notif_body_fsi_denied_with_time, time)
        time.isBlank() -> app.getString(R.string.prayer_azan_notif_body_no_time)
        else -> app.getString(R.string.prayer_azan_notif_body_with_time, time)
      }

    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(app, AZAN_CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(app)
      }

    builder
      .setSmallIcon(R.drawable.notification_icon)
      .setContentTitle(title)
      .setContentText(body)
      .setContentIntent(contentIntent)
      .setCategory(Notification.CATEGORY_ALARM)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setAutoCancel(false)
      .setOngoing(true)
      .setShowWhen(true)
      .setWhen(System.currentTimeMillis())
      .setSound(null)

    @Suppress("DEPRECATION")
    builder.setPriority(Notification.PRIORITY_MAX)

    if (fsiAllowed) {
      builder.setFullScreenIntent(fullScreenIntent, true)
    } else {
      Log.w(TAG, "Full-screen intent disabled — content notification only for $salatKey")
    }

    try {
      mgr.notify(FSI_NOTIFICATION_ID, builder.build())
      Log.i(TAG, "Posted azan FSI notification for $salatKey (fsiAllowed=$fsiAllowed)")
    } catch (t: Throwable) {
      Log.w(TAG, "Unable to show azan notification for $salatKey", t)
    }
  }

  fun clearFullScreenAzanLaunch(context: Context) {
    clearFullScreenNotification(context)
  }

  private fun clearFullScreenNotification(context: Context) {
    try {
      val mgr = context.applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      mgr.cancel(FSI_NOTIFICATION_ID)
    } catch (_: Throwable) {
      /* best effort */
    }
  }

  /** Намаз уақытында азан экраны ашылады (құлыптаулы телефонда да, PIN сұрамай). */
  fun deliverAzan(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    val app = context.applicationContext
    PrayerAzanActiveSession.markActive(app)
    PrayerAzanPendingLaunch.save(app, label, enteredTitle, time, soundId, salatKey)
    releaseHeldWakeLock()
    heldWakeLock = acquireAzanWakeLock(app)
    try {
      if (soundId != "off") {
        PrayerAzanNativePlayer.play(app, soundId)
      }
      // Негізгі: FSI notification (locked screen). Қосымша: тікелей Activity.
      showAzanFullScreenNotification(app, label, enteredTitle, time, soundId, salatKey)
      scheduleAzanActivityLaunches(context, label, enteredTitle, time, soundId, salatKey)
      // FSI-ді өшірмеу — тек ескі Expo/legacy хабарламаларды тазалау.
      PrayerLegacyNotificationCleaner.clearLegacyDuringAzanDelivery(app)
    } catch (t: Throwable) {
      Log.w(TAG, "deliverAzan failed for $salatKey", t)
    }
    // Wake lock dismissAzanDelivery-ге дейін ұсталады (8с емес) — RN boot + құлып экраны үшін.
  }

  fun acquireAzanWakeLock(context: Context): PowerManager.WakeLock? {
    val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return null
    return try {
      @Suppress("DEPRECATION")
      pm.newWakeLock(
        PowerManager.FULL_WAKE_LOCK or
          PowerManager.ACQUIRE_CAUSES_WAKEUP or
          PowerManager.ON_AFTER_RELEASE,
        "raqat:PrayerAzanWake"
      ).apply {
        setReferenceCounted(false)
        acquire(5 * 60 * 1000L)
      }
    } catch (t: Throwable) {
      Log.w(TAG, "FULL_WAKE_LOCK failed, falling back to PARTIAL", t)
      try {
        pm.newWakeLock(
          PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
          "raqat:PrayerAzanWakePartial"
        ).apply {
          setReferenceCounted(false)
          acquire(5 * 60 * 1000L)
        }
      } catch (t2: Throwable) {
        Log.w(TAG, "Unable to acquire azan wake lock", t2)
        null
      }
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
    deliverAzan(context, label, enteredTitle, time, soundId, salatKey)
  }

  fun dismissAzanDelivery(context: Context) {
    val app = context.applicationContext
    try {
      PrayerAzanDeliveryService.stopRunning(app)
    } catch (_: Throwable) {
      /* best effort */
    }
    clearFullScreenNotification(app)
    PrayerAzanNativePlayer.stop()
    PrayerAzanActiveSession.clear(app)
    PrayerAzanPendingLaunch.clear(app)
    PrayerLegacyNotificationCleaner.clear(app)
    releaseHeldWakeLock()
  }

  private fun releaseHeldWakeLock() {
    try {
      val wl = heldWakeLock
      heldWakeLock = null
      if (wl?.isHeld == true) wl.release()
    } catch (_: Throwable) {
      /* best effort */
    }
  }

  private fun ensureChannel(context: Context, mgr: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel =
      NotificationChannel(
        AZAN_CHANNEL_ID,
        context.getString(R.string.prayer_azan_channel_name),
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = context.getString(R.string.prayer_azan_channel_desc)
        setSound(null, null)
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 280, 180, 280)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        setBypassDnd(true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          setAllowBubbles(false)
        }
      }
    // IMPORTANCE_MAX жоқ — HIGH + CATEGORY_ALARM + FSI жеткілікті; OEM-де MAX қабылданбауы мүмкін.
    mgr.createNotificationChannel(channel)
  }

  private fun enc(value: String): String = URLEncoder.encode(value, "UTF-8")

  private fun stableNotificationId(value: String): Int {
    val raw = value.hashCode()
    return if (raw == Int.MIN_VALUE) 904221 else kotlin.math.abs(raw)
  }
}
