package kz.raqat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** Құлып ашылғанда — белсенді азан сессиясы үшін бетті міндетті көрсету. */
class PrayerAzanUnlockReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_USER_PRESENT) return
    val app = context.applicationContext
    if (!PrayerAzanActiveSession.isActive(app)) return
    val pending = PrayerAzanPendingLaunch.read(app) ?: return
    val label = pending["label"].orEmpty()
    val enteredTitle = pending["enteredTitle"].orEmpty()
    val time = pending["time"].orEmpty()
    val soundId = pending["soundId"].orEmpty().ifBlank { "adhan_haramain" }
    val salatKey = pending["salatKey"].orEmpty()
    Log.i(TAG, "USER_PRESENT — opening azan UI")
    try {
      PrayerAzanDelivery.showAzanFullScreenNotification(
        app,
        label,
        enteredTitle,
        time,
        soundId,
        salatKey
      )
      if (!PrayerAzanOverlay.show(app, label, enteredTitle, time, soundId, salatKey)) {
        PrayerAzanDelivery.tryStartAzanActivity(app, label, enteredTitle, time, soundId, salatKey)
      }
    } catch (t: Throwable) {
      Log.w(TAG, "USER_PRESENT azan UI failed", t)
    }
  }

  companion object {
    private const val TAG = "PrayerAzanUnlock"
  }
}
