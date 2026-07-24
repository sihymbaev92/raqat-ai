package kz.raqat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log

/**
 * Exact alarm → алдымен көрінетін UI (overlay/FSI/LockActivity), сосын дыбыс.
 */
class PrayerAzanAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != PrayerAzanAlarmScheduler.ACTION_AZAN) return

    val app = context.applicationContext
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
    val atMillis = intent.getLongExtra(PrayerAzanAlarmScheduler.EXTRA_AT_MILLIS, 0L)
    if (atMillis > 0L && System.currentTimeMillis() - atMillis > MAX_LATE_AZAN_MS) {
      Log.i(TAG, "Ignoring stale azan alarm for $salatKey")
      return
    }

    val pendingResult = goAsync()
    var sessionGen = PrayerAzanActiveSession.currentGeneration()
    // Allowlist: FSI + FGS (overlay FGS ішінен)
    try {
      PrayerAzanActiveSession.markActive(app)
      sessionGen = PrayerAzanActiveSession.currentGeneration()
      PrayerAzanPendingLaunch.save(app, label, enteredTitle, time, soundId, salatKey)
      PrayerAzanDelivery.showAzanFullScreenNotification(app, label, enteredTitle, time, soundId, salatKey)
      PrayerAzanDelivery.tryStartAzanActivity(app, label, enteredTitle, time, soundId, salatKey)
    } catch (t: Throwable) {
      Log.w(TAG, "Immediate azan UI failed for $salatKey", t)
    }

    Handler(Looper.getMainLooper()).post {
      try {
        if (!PrayerAzanActiveSession.isGenerationCurrent(sessionGen)) {
          Log.i(TAG, "Skip FGS start — azan dismissed for $salatKey")
          return@post
        }
        PrayerAzanDeliveryService.start(app, label, enteredTitle, time, soundId, salatKey)
      } catch (t: Throwable) {
        Log.w(TAG, "Azan FGS failed for $salatKey", t)
        try {
          if (PrayerAzanActiveSession.isGenerationCurrent(sessionGen)) {
            PrayerAzanDelivery.deliverAzan(app, label, enteredTitle, time, soundId, salatKey)
          }
        } catch (t2: Throwable) {
          Log.w(TAG, "Inline azan fallback failed for $salatKey", t2)
        }
      } finally {
        Handler(Looper.getMainLooper()).postDelayed(
          { pendingResult.finish() },
          ALARM_RECEIVER_FINISH_DELAY_MS
        )
      }
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

  companion object {
    private const val TAG = "PrayerAzanAlarm"
    private const val MAX_LATE_AZAN_MS = 15 * 60 * 1000L
    const val ALARM_RECEIVER_FINISH_DELAY_MS = 8_000L
  }
}
