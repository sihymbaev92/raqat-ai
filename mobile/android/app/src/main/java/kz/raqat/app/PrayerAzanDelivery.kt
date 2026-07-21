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
  private const val AZAN_CHANNEL_ID = "raqat_native_azan_v5"
  /** FGS үшін тыныш канал — heads-up / төбе баннер шықпасын. */
  private const val AZAN_QUIET_CHANNEL_ID = "raqat_native_azan_quiet_v1"
  private const val TAG = "PrayerAzanDelivery"
  const val FSI_NOTIFICATION_ID = 904224

  /** MainActivity құлып экраны flag-тары — тек осы extras бар intent. */
  const val EXTRA_AZAN_TRUSTED = "kz.raqat.app.AZAN_TRUSTED"

  /** Intent flags — Activity API 29+ атаулары кей SDK-да жоқ болуы мүмкін. */
  const val FLAG_SHOW_WHEN_LOCKED = 0x00080000
  const val FLAG_TURN_SCREEN_ON = 0x00200000

  enum class AzanNotifMode {
    /** Құлып экранында FSI ояту — бір рет. */
    FULL_SCREEN_LAUNCH,
    /** Азан беті ашылғаннан кейін FGS — төбеге heads-up жоқ. */
    QUIET_ONGOING,
  }

  @Volatile
  private var heldWakeLock: PowerManager.WakeLock? = null

  /** Толық RN PrayerAzanScreen — намаз уақытындағы негізгі азан беті. */
  fun azanActivityIntent(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ): Intent = azanMainActivityIntent(context, label, enteredTitle, time, soundId, salatKey)

  /** Толық RN PrayerAzanScreen — deep link. */
  fun azanMainActivityIntent(
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
    val launchFlags =
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
    longArrayOf(0L, 250L, 700L, 1_500L, 3_000L, 6_000L, 12_000L, 25_000L, 45_000L, 75_000L, 120_000L)

  fun tryStartAzanActivity(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    tryStartAzanScreens(context, label, enteredTitle, time, soundId, salatKey)
  }

  /** Негізгі: толық RN PrayerAzanScreen. Fallback: LockActivity. */
  fun tryStartAzanScreens(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    startActivityAllowed(
      context,
      azanMainActivityIntent(context, label, enteredTitle, time, soundId, salatKey),
      "MainAzan/$salatKey"
    )
  }

  fun tryStartAzanLockFallback(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    startActivityAllowed(
      context,
      PrayerAzanLockActivity.createIntent(context, label, enteredTitle, time, soundId, salatKey),
      "LockActivity/$salatKey"
    )
  }

  private fun startActivityAllowed(context: Context, intent: Intent, tag: String) {
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
      Log.i(TAG, "Started azan activity $tag")
    } catch (t: Throwable) {
      Log.w(TAG, "Unable to start azan activity $tag", t)
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
          tryStartAzanScreens(context, label, enteredTitle, time, soundId, salatKey)
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
   * Азан беті ашылған соң [suppressAzanHeadsUpWhileUiShowing] — төбе баннер жоқ.
   */
  fun buildAzanNotification(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String,
    mode: AzanNotifMode = AzanNotifMode.FULL_SCREEN_LAUNCH
  ): Notification {
    val app = context.applicationContext
    val mgr = app.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
    if (mgr != null) {
      ensureChannel(app, mgr)
      ensureQuietChannel(app, mgr)
    }
    val activityIntent = azanActivityIntent(app, label, enteredTitle, time, soundId, salatKey)
    val piFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val activityOpts =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        ActivityOptions.makeBasic()
          .apply {
            setPendingIntentBackgroundActivityStartMode(
              ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED
            )
          }
          .toBundle()
      } else {
        null
      }
    val contentIntent =
      if (activityOpts != null) {
        PendingIntent.getActivity(
          app,
          stableNotificationId("content-$salatKey-$time"),
          activityIntent,
          piFlags,
          activityOpts
        )
      } else {
        PendingIntent.getActivity(app, stableNotificationId("content-$salatKey-$time"), activityIntent, piFlags)
      }
    val fullScreenIntent =
      if (activityOpts != null) {
        PendingIntent.getActivity(
          app,
          stableNotificationId("full-$salatKey-$time"),
          activityIntent,
          piFlags,
          activityOpts
        )
      } else {
        PendingIntent.getActivity(app, stableNotificationId("full-$salatKey-$time"), activityIntent, piFlags)
      }

    val defaultLabel = app.getString(R.string.prayer_azan_default_label)
    val title = enteredTitle.ifBlank { label }.ifBlank { defaultLabel }
    val fsiAllowed = canUseFullScreenIntent(app)
    val quiet = mode == AzanNotifMode.QUIET_ONGOING
    val channelId = if (quiet) AZAN_QUIET_CHANNEL_ID else AZAN_CHANNEL_ID
    val body =
      when {
        quiet ->
          if (time.isBlank()) app.getString(R.string.prayer_azan_notif_body_quiet)
          else app.getString(R.string.prayer_azan_notif_body_quiet_with_time, time)
        !fsiAllowed && time.isBlank() -> app.getString(R.string.prayer_azan_notif_body_fsi_denied)
        !fsiAllowed -> app.getString(R.string.prayer_azan_notif_body_fsi_denied_with_time, time)
        time.isBlank() -> app.getString(R.string.prayer_azan_notif_body_no_time)
        else -> app.getString(R.string.prayer_azan_notif_body_with_time, time)
      }

    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(app, channelId)
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
      .setOnlyAlertOnce(true)
      .setShowWhen(true)
      .setWhen(System.currentTimeMillis())
      .setSound(null)

    if (quiet) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        builder.setGroup("raqat_azan_quiet")
      }
      @Suppress("DEPRECATION")
      builder.setPriority(Notification.PRIORITY_LOW)
      // Heads-up / action баннер жоқ — IMPORTANCE_LOW канал + action жоқ.
    } else {
      val stopIntent =
        Intent(app, PrayerAzanStopReceiver::class.java).apply {
          action = PrayerAzanStopReceiver.ACTION_STOP
        }
      val stopPi =
        PendingIntent.getBroadcast(app, stableNotificationId("stop-$salatKey-$time"), stopIntent, piFlags)
      builder
        .addAction(0, app.getString(R.string.prayer_azan_notif_stop), stopPi)
        .addAction(0, app.getString(R.string.prayer_azan_lock_open_app), contentIntent)
      @Suppress("DEPRECATION")
      builder.setPriority(Notification.PRIORITY_MAX)
      if (fsiAllowed) {
        builder.setFullScreenIntent(fullScreenIntent, true)
      } else {
        Log.w(TAG, "Full-screen intent disabled — content notification only for $salatKey")
      }
    }

    return builder.build()
  }

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
    try {
      val notification =
        buildAzanNotification(
          app,
          label,
          enteredTitle,
          time,
          soundId,
          salatKey,
          AzanNotifMode.FULL_SCREEN_LAUNCH
        )
      mgr.notify(FSI_NOTIFICATION_ID, notification)
      Log.i(TAG, "Posted azan FSI notification for $salatKey (fsiAllowed=${canUseFullScreenIntent(app)})")
    } catch (t: Throwable) {
      Log.w(TAG, "Unable to show azan notification for $salatKey", t)
    }
  }

  /**
   * Азан беті ашылғаннан кейін төбедегі heads-up баннерді алып тастау
   * (FGS үшін тыныш ongoing қалады — құлыптағы толық экран беті өзгермейді).
   */
  fun suppressAzanHeadsUpWhileUiShowing(context: Context) {
    val app = context.applicationContext
    if (!PrayerAzanActiveSession.isActive(app)) return
    val pending = PrayerAzanPendingLaunch.read(app) ?: return
    val mgr = app.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    try {
      val quiet =
        buildAzanNotification(
          app,
          pending["label"].orEmpty(),
          pending["enteredTitle"].orEmpty(),
          pending["time"].orEmpty(),
          pending["soundId"].orEmpty().ifBlank { "adhan_haramain" },
          pending["salatKey"].orEmpty(),
          AzanNotifMode.QUIET_ONGOING
        )
      mgr.notify(FSI_NOTIFICATION_ID, quiet)
      Log.i(TAG, "Suppressed azan heads-up — quiet ongoing for FGS")
    } catch (t: Throwable) {
      Log.w(TAG, "Unable to suppress azan heads-up", t)
    }
  }

  fun scheduleSuppressAzanHeadsUp(context: Context) {
    val app = context.applicationContext
    val handler = Handler(Looper.getMainLooper())
    for (delay in longArrayOf(350L, 900L, 2_000L)) {
      handler.postDelayed({ suppressAzanHeadsUpWhileUiShowing(app) }, delay)
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

  /** FGS ішінен: notification уже startForeground — дыбыс + бет. */
  fun deliverAzanFromForeground(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    runAzanDelivery(context, label, enteredTitle, time, soundId, salatKey, postNotification = false)
  }

  /**
   * Намаз уақытында азан беті міндетті: FSI + дыбыс + Lock/Main қайталау.
   * AlarmReceiver әдетте FGS арқылы шақырады; бұл — тікелей fallback.
   */
  fun deliverAzan(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    runAzanDelivery(context, label, enteredTitle, time, soundId, salatKey, postNotification = true)
  }

  private fun runAzanDelivery(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String,
    postNotification: Boolean
  ) {
    val app = context.applicationContext
    PrayerAzanActiveSession.markActive(app)
    PrayerAzanPendingLaunch.save(app, label, enteredTitle, time, soundId, salatKey)
    releaseHeldWakeLock()
    heldWakeLock = acquireAzanWakeLock(app)
    try {
      // Бет алдымен. Дыбыс — тек LockActivity фокус / Overlay көрінгенде.
      if (postNotification) {
        showAzanFullScreenNotification(app, label, enteredTitle, time, soundId, salatKey)
      }
      PrayerLegacyNotificationCleaner.clearLegacyDuringAzanDelivery(app)
      tryStartAzanScreens(app, label, enteredTitle, time, soundId, salatKey)
      scheduleAzanActivityLaunches(context, label, enteredTitle, time, soundId, salatKey)
      scheduleSuppressAzanHeadsUp(app)
      Handler(Looper.getMainLooper()).postDelayed(
        {
          if (!PrayerAzanActiveSession.isActive(app)) return@postDelayed
          if (PrayerAzanOverlay.isShowing()) return@postDelayed
          if (PrayerAzanNativePlayer.isPlaying()) return@postDelayed
          PrayerAzanOverlay.show(app, label, enteredTitle, time, soundId, salatKey)
        },
        1_800L
      )
    } catch (t: Throwable) {
      Log.w(TAG, "deliverAzan failed for $salatKey", t)
    }
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

  /**
   * AlarmClock / FSI MainActivity-ны ашқанда: сессия + FSI «Өшіру» + дыбыс.
   * (RN PrayerAzanScreen nativeAudio=1 — JS қайта қоспайды.)
   */
  fun bootstrapAzanFromMainActivity(context: Context, intent: Intent?) {
    val app = context.applicationContext
    val data = intent?.data
    if (data?.host != "azan") return
    if (intent.getBooleanExtra(EXTRA_AZAN_TRUSTED, false) != true) return

    val defaultLabel = app.getString(R.string.prayer_azan_default_label)
    val label =
      intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_LABEL).orEmpty()
        .ifBlank { data.getQueryParameter("label").orEmpty() }
        .ifBlank { defaultLabel }
    val enteredTitle =
      intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_ENTERED_TITLE).orEmpty()
        .ifBlank { data.getQueryParameter("enteredTitle").orEmpty() }
        .ifBlank {
          if (label == defaultLabel) app.getString(R.string.prayer_azan_fullscreen_title)
          else app.getString(R.string.prayer_azan_entered_for_label, label)
        }
    val time =
      intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_TIME).orEmpty()
        .ifBlank { data.getQueryParameter("time").orEmpty() }
    val soundId =
      intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SOUND_ID).orEmpty()
        .ifBlank { data.getQueryParameter("soundId").orEmpty() }
        .ifBlank { "adhan_haramain" }
    val salatKey =
      intent.getStringExtra(PrayerAzanAlarmScheduler.EXTRA_SALAT_KEY).orEmpty()
        .ifBlank { data.getQueryParameter("salatKey").orEmpty() }

    PrayerAzanActiveSession.markActive(app)
    PrayerAzanPendingLaunch.save(app, label, enteredTitle, time, soundId, salatKey)
    // Бет әлдеқашан ашық — FSI heads-up қайта жарияламау; тыныш FGS қана.
    suppressAzanHeadsUpWhileUiShowing(app)
    scheduleSuppressAzanHeadsUp(app)
    if (soundId != "off" && !PrayerAzanNativePlayer.isPlaying()) {
      PrayerAzanNativePlayer.play(app, soundId)
    }
    try {
      PrayerAzanDeliveryService.start(
        app,
        label,
        enteredTitle,
        time,
        soundId,
        salatKey,
        skipUiLaunch = true
      )
    } catch (_: Throwable) {
      /* */
    }
  }

  fun dismissAzanDelivery(context: Context) {
    val app = context.applicationContext
    try {
      PrayerAzanDeliveryService.stopRunning(app)
    } catch (_: Throwable) {
      /* best effort */
    }
    PrayerAzanOverlay.hide(app)
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
    // v5 — Honor кейде ескі каналдың lockscreenVisibility/importance-ін «қатырады»
    val channelId = AZAN_CHANNEL_ID
    val channel =
      NotificationChannel(
        channelId,
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
    mgr.createNotificationChannel(channel)
  }

  private fun ensureQuietChannel(context: Context, mgr: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel =
      NotificationChannel(
        AZAN_QUIET_CHANNEL_ID,
        context.getString(R.string.prayer_azan_quiet_channel_name),
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = context.getString(R.string.prayer_azan_quiet_channel_desc)
        setSound(null, null)
        enableVibration(false)
        setShowBadge(false)
        lockscreenVisibility = Notification.VISIBILITY_SECRET
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          setAllowBubbles(false)
        }
      }
    mgr.createNotificationChannel(channel)
  }

  private fun enc(value: String): String = URLEncoder.encode(value, "UTF-8")

  private fun stableNotificationId(value: String): Int {
    val raw = value.hashCode()
    return if (raw == Int.MIN_VALUE) 904221 else kotlin.math.abs(raw)
  }
}
