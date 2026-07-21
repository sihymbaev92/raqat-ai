package kz.raqat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** Хабарламадағы «Өшіру» — азан дыбысын және сессияны тоқтатады. */
class PrayerAzanStopReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != ACTION_STOP) return
    Log.i(TAG, "Stop action from azan notification")
    PrayerAzanDelivery.dismissAzanDelivery(context.applicationContext)
  }

  companion object {
    private const val TAG = "PrayerAzanStop"
    const val ACTION_STOP = "kz.raqat.app.action.PRAYER_AZAN_STOP"
  }
}
