package kz.raqat.app

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView

/**
 * Құлып экранындағы жылдам қабық: дереу толық RN PrayerAzanScreen-ге өткізеді.
 * MainActivity ашылмаса — осы бет + «Жабу» қалады.
 */
class PrayerAzanLockActivity : Activity() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var handedOffToMain = false

  override fun onCreate(savedInstanceState: Bundle?) {
    applyLockScreenWindowFlags()
    super.onCreate(savedInstanceState)
    if (isStaleAlarm(intent)) {
      finish()
      return
    }
    setContentView(R.layout.activity_prayer_azan_lock)
    bindFromIntent(intent)
    dismissKeyguardIfNeeded()
    startAzanSession(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    if (isStaleAlarm(intent)) {
      finish()
      return
    }
    applyLockScreenWindowFlags()
    bindFromIntent(intent)
    dismissKeyguardIfNeeded()
    startAzanSession(intent)
  }

  override fun onResume() {
    super.onResume()
    applyLockScreenWindowFlags()
    dismissKeyguardIfNeeded()
  }

  override fun onDestroy() {
    mainHandler.removeCallbacksAndMessages(null)
    super.onDestroy()
  }

  /** Құлыпта: дыбыс + FSI, сосын толық азан беті (MainActivity). */
  private fun startAzanSession(intent: Intent?) {
    val soundId = intent?.getStringExtra(EXTRA_SOUND_ID).orEmpty().ifBlank { "adhan_haramain" }
    val label = intent?.getStringExtra(EXTRA_LABEL).orEmpty()
    val entered = intent?.getStringExtra(EXTRA_ENTERED_TITLE).orEmpty()
    val time = intent?.getStringExtra(EXTRA_TIME).orEmpty()
    val salatKey = intent?.getStringExtra(EXTRA_SALAT_KEY).orEmpty()

    PrayerAzanActiveSession.markActive(applicationContext)
    PrayerAzanPendingLaunch.save(applicationContext, label, entered, time, soundId, salatKey)

    try {
      PrayerAzanDelivery.showAzanFullScreenNotification(
        applicationContext,
        label,
        entered,
        time,
        soundId,
        salatKey
      )
      PrayerAzanDelivery.scheduleSuppressAzanHeadsUp(applicationContext)
    } catch (_: Throwable) {
      /* */
    }

    if (soundId != "off" && !PrayerAzanNativePlayer.isPlaying()) {
      PrayerAzanNativePlayer.play(applicationContext, soundId)
    }

    try {
      PrayerAzanDeliveryService.start(
        applicationContext,
        label,
        entered,
        time,
        soundId,
        salatKey,
        skipUiLaunch = true
      )
    } catch (_: Throwable) {
      /* */
    }

    // Толық алдыңғы азан экраны — құлып үстінде
    openFullAzanScreen(label, entered, time, soundId, salatKey)

    // Main ашылмаса — overlay
    val gen = PrayerAzanActiveSession.currentGeneration()
    mainHandler.postDelayed(
      {
        if (!PrayerAzanActiveSession.isGenerationCurrent(gen)) return@postDelayed
        if (!PrayerAzanActiveSession.isActive(applicationContext)) return@postDelayed
        if (isFinishing || isDestroyed) return@postDelayed
        if (handedOffToMain && !hasWindowFocus()) {
          // Main алдыңғы қатарда — қабықты жабу
          finish()
          return@postDelayed
        }
        if (hasWindowFocus()) {
          PrayerAzanOverlay.show(applicationContext, label, entered, time, soundId, salatKey)
        }
      },
      2_000L
    )
  }

  private fun openFullAzanScreen(
    label: String,
    entered: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    handedOffToMain = true
    try {
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
    } catch (_: Throwable) {
      handedOffToMain = false
    }
  }

  private fun isStaleAlarm(intent: Intent?): Boolean {
    val atMillis = intent?.getLongExtra(PrayerAzanAlarmScheduler.EXTRA_AT_MILLIS, 0L) ?: 0L
    if (atMillis <= 0L) return false
    return System.currentTimeMillis() - atMillis > 15 * 60 * 1000L
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
      openFullAzanScreen(label, entered, time, soundId, salatKey)
    }
  }

  private fun dismissKeyguardIfNeeded() {
    try {
      val km = getSystemService(KeyguardManager::class.java) ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        km.requestDismissKeyguard(this, null)
      }
    } catch (_: Throwable) {
      /* OEM */
    }
  }

  private fun applyLockScreenWindowFlags() {
    @Suppress("DEPRECATION")
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
    )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      window.statusBarColor = 0xFF0B1220.toInt()
      window.navigationBarColor = 0xFF0B1220.toInt()
    }
  }

  companion object {
    const val EXTRA_LABEL = "label"
    const val EXTRA_ENTERED_TITLE = "enteredTitle"
    const val EXTRA_TIME = "time"
    const val EXTRA_SOUND_ID = "soundId"
    const val EXTRA_SALAT_KEY = "salatKey"
    const val EXTRA_FROM_ALARM = "fromAlarm"

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
            PrayerAzanDelivery.FLAG_SHOW_WHEN_LOCKED or
            PrayerAzanDelivery.FLAG_TURN_SCREEN_ON
        )
      }
    }
  }
}
