package kz.raqat.app

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView

/**
 * Жеңіл native азан экраны — React Native boot күтпей құлып үстінде бірден көрінеді.
 * FSI / AlarmReceiver осы Activity-ге бағытталады.
 */
class PrayerAzanLockActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    setShowWhenLockedAndTurnOn()
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_prayer_azan_lock)
    bindFromIntent(intent)
    ensureAzanAudioPlaying(intent)
    // FSI үшін notification қажет, бірақ бет ашылған соң оны жасырамыз — UX «тек толық экран».
    PrayerAzanDelivery.clearFullScreenAzanLaunch(applicationContext)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    setShowWhenLockedAndTurnOn()
    bindFromIntent(intent)
    ensureAzanAudioPlaying(intent)
    PrayerAzanDelivery.clearFullScreenAzanLaunch(applicationContext)
  }

  override fun onResume() {
    super.onResume()
    setShowWhenLockedAndTurnOn()
    PrayerAzanDelivery.clearFullScreenAzanLaunch(applicationContext)
  }

  private fun ensureAzanAudioPlaying(intent: Intent?) {
    val soundId = intent?.getStringExtra(EXTRA_SOUND_ID).orEmpty().ifBlank { "adhan_haramain" }
    if (soundId == "off") return
    val label = intent?.getStringExtra(EXTRA_LABEL).orEmpty()
    val entered = intent?.getStringExtra(EXTRA_ENTERED_TITLE).orEmpty()
    val time = intent?.getStringExtra(EXTRA_TIME).orEmpty()
    val salatKey = intent?.getStringExtra(EXTRA_SALAT_KEY).orEmpty()
    PrayerAzanActiveSession.markActive(applicationContext)
    PrayerAzanPendingLaunch.save(applicationContext, label, entered, time, soundId, salatKey)
    if (!PrayerAzanNativePlayer.isPlaying()) {
      PrayerAzanNativePlayer.play(applicationContext, soundId)
    }
  }

  private fun bindFromIntent(intent: Intent?) {
    val title =
      intent?.getStringExtra(EXTRA_ENTERED_TITLE)?.takeIf { it.isNotBlank() }
        ?: intent?.getStringExtra(EXTRA_LABEL)?.takeIf { it.isNotBlank() }
        ?: getString(R.string.prayer_azan_fullscreen_title)
    val time = intent?.getStringExtra(EXTRA_TIME).orEmpty()
    val subtitle =
      if (time.isBlank()) {
        getString(R.string.prayer_azan_lock_subtitle)
      } else {
        getString(R.string.prayer_azan_lock_subtitle_with_time, time)
      }

    findViewById<TextView>(R.id.azanTitle).text = title
    findViewById<TextView>(R.id.azanSubtitle).text = subtitle
    findViewById<Button>(R.id.azanDismiss).setOnClickListener {
      PrayerAzanDelivery.dismissAzanDelivery(applicationContext)
      finish()
    }
    findViewById<Button>(R.id.azanOpenApp).setOnClickListener {
      val label = intent?.getStringExtra(EXTRA_LABEL).orEmpty()
      val entered = intent?.getStringExtra(EXTRA_ENTERED_TITLE).orEmpty()
      val soundId = intent?.getStringExtra(EXTRA_SOUND_ID).orEmpty()
      val salatKey = intent?.getStringExtra(EXTRA_SALAT_KEY).orEmpty()
      startActivity(
        PrayerAzanDelivery.azanMainActivityIntent(
          applicationContext,
          label,
          entered,
          time,
          soundId,
          salatKey
        )
      )
      finish()
    }
  }

  private fun setShowWhenLockedAndTurnOn() {
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      )
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      window.statusBarColor = 0xFF0B1220.toInt()
      window.navigationBarColor = 0xFF0B1220.toInt()
    }
    @Suppress("DEPRECATION")
    window.decorView.systemUiVisibility =
      (View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN)
  }

  companion object {
    const val EXTRA_LABEL = "label"
    const val EXTRA_ENTERED_TITLE = "enteredTitle"
    const val EXTRA_TIME = "time"
    const val EXTRA_SOUND_ID = "soundId"
    const val EXTRA_SALAT_KEY = "salatKey"

    fun createIntent(
      context: Context,
      label: String,
      enteredTitle: String,
      time: String,
      soundId: String,
      salatKey: String
    ): Intent {
      return Intent(context, PrayerAzanLockActivity::class.java).apply {
        putExtra(EXTRA_LABEL, label)
        putExtra(EXTRA_ENTERED_TITLE, enteredTitle)
        putExtra(EXTRA_TIME, time)
        putExtra(EXTRA_SOUND_ID, soundId)
        putExtra(EXTRA_SALAT_KEY, salatKey)
        putExtra(PrayerAzanDelivery.EXTRA_AZAN_TRUSTED, true)
        addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_SINGLE_TOP or
            Intent.FLAG_ACTIVITY_NO_USER_ACTION or
            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
            PrayerAzanDelivery.FLAG_SHOW_WHEN_LOCKED or
            PrayerAzanDelivery.FLAG_TURN_SCREEN_ON
        )
      }
    }
  }
}
