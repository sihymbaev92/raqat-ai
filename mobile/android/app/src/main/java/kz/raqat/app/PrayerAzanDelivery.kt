package kz.raqat.app

import android.app.ActivityOptions
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import java.net.URLEncoder

/**
 * Азан жеткізу: тікелей MainActivity → PrayerAzanScreen (құлыптаулы/ашық бірдей).
 */
object PrayerAzanDelivery {
  private const val TAG = "PrayerAzanDelivery"
  /** Ескі FSI хабарландыруы — жаңа нұсқада жарияланбайды, тек тазалау үшін. */
  private const val LEGACY_FSI_NOTIFICATION_ID = 904224

  /** MainActivity құлып экраны flag-тары — тек осы extras бар intent. */
  const val EXTRA_AZAN_TRUSTED = "kz.raqat.app.AZAN_TRUSTED"

  /** Intent flags — Activity API 29+ атаулары кей SDK-да жоқ болуы мүмкін. */
  private const val FLAG_SHOW_WHEN_LOCKED = 0x00080000
  private const val FLAG_TURN_SCREEN_ON = 0x00200000

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
    var launchFlags =
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_CLEAR_TOP or
        Intent.FLAG_ACTIVITY_SINGLE_TOP or
        Intent.FLAG_ACTIVITY_NO_USER_ACTION or
        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      launchFlags = launchFlags or FLAG_SHOW_WHEN_LOCKED or FLAG_TURN_SCREEN_ON
    }
    return Intent(Intent.ACTION_VIEW, uri, context, MainActivity::class.java).apply {
      putExtra(EXTRA_AZAN_TRUSTED, true)
      flags = launchFlags
    }
  }

  private val AZAN_LAUNCH_RETRY_MS = longArrayOf(0L, 400L, 1_000L, 2_000L, 4_000L, 8_000L, 15_000L)

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

  /** Фон/құлып экраны: бірнеше рет қайталау — экран әрқашан ашылуы керек. */
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
        { tryStartAzanActivity(context, label, enteredTitle, time, soundId, salatKey) },
        delay
      )
    }
  }

  fun clearFullScreenAzanLaunch(context: Context) {
    clearLegacyFullScreenNotification(context)
  }

  private fun clearLegacyFullScreenNotification(context: Context) {
    try {
      val mgr = context.applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      mgr.cancel(LEGACY_FSI_NOTIFICATION_ID)
    } catch (_: Throwable) {
      /* best effort */
    }
  }

  /** Намаз уақытында азан экраны ашылады (құлыптаулы телефонда да). */
  fun deliverAzan(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    val app = context.applicationContext
    PrayerAzanActiveSession.active = true
    val wakeLock = acquireAzanWakeLock(app)
    try {
      if (soundId != "off") {
        PrayerAzanNativePlayer.play(app, soundId)
      }
      scheduleAzanActivityLaunches(context, label, enteredTitle, time, soundId, salatKey)
      clearLegacyFullScreenNotification(app)
      PrayerLegacyNotificationCleaner.clearRepeatedly(app)
    } finally {
      Handler(Looper.getMainLooper()).postDelayed({
        try {
          if (wakeLock?.isHeld == true) wakeLock.release()
        } catch (_: Throwable) {
          /* best effort */
        }
      }, 8_000L)
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
        acquire(3 * 60 * 1000L)
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
    deliverAzan(context, label, enteredTitle, time, soundId, salatKey)
  }

  fun dismissAzanDelivery(context: Context) {
    val app = context.applicationContext
    try {
      PrayerAzanDeliveryService.stopRunning(app)
    } catch (_: Throwable) {
      /* best effort */
    }
    clearLegacyFullScreenNotification(app)
    PrayerAzanNativePlayer.stop()
    PrayerAzanActiveSession.active = false
    PrayerLegacyNotificationCleaner.clear(app)
  }

  private fun enc(value: String): String = URLEncoder.encode(value, "UTF-8")
}
