package kz.raqat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** Dev/QA: adb арқылы test azan жоспарлау (locked-screen QA скрипті). */
class PrayerAzanQaReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != ACTION_SCHEDULE_QA) return
    val delay = intent.getIntExtra(EXTRA_DELAY_SECONDS, 90).coerceIn(15, 600)
    val result = PrayerAzanAlarmScheduler.scheduleTestAlarm(context.applicationContext, delay)
    Log.i(
      TAG,
      "Scheduled QA azan in ${delay}s count=${result.scheduledCount} exact=${result.exactAlarmPermissionGranted}"
    )
  }

  companion object {
    const val ACTION_SCHEDULE_QA = "kz.raqat.app.action.SCHEDULE_AZAN_QA"
    const val EXTRA_DELAY_SECONDS = "delaySeconds"
    private const val TAG = "PrayerAzanQa"
  }
}
