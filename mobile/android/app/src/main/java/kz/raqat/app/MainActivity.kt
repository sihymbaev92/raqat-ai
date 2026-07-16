package kz.raqat.app

import android.content.Intent
import android.os.Bundle
import android.os.Build
import android.view.WindowManager

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    applyAzanWindowFlags(intent)
    if (isTrustedAzanIntent(intent)) {
      PrayerAzanDelivery.clearFullScreenAzanLaunch(this)
    }
    super.onCreate(null)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    applyAzanWindowFlags(intent)
    if (isTrustedAzanIntent(intent)) {
      PrayerAzanDelivery.clearFullScreenAzanLaunch(this)
    }
  }

  override fun onResume() {
    super.onResume()
    if (isTrustedAzanIntent(intent)) {
      applyAzanWindowFlags(intent)
    }
  }

  private fun isTrustedAzanIntent(intent: Intent?): Boolean {
    return intent?.data?.host == "azan" &&
      intent.getBooleanExtra(PrayerAzanDelivery.EXTRA_AZAN_TRUSTED, false)
  }

  fun clearAzanLaunchState() {
    setIntent(
      Intent(this, MainActivity::class.java).apply {
        action = Intent.ACTION_MAIN
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
    )
    applyAzanWindowFlags(intent)
  }

  private fun applyAzanWindowFlags(intent: Intent?) {
    // Тек өз PendingIntent-тен (EXTRA_AZAN_TRUSTED) — сыртқы imamai://azan VIEW құлып экранын ашпайды.
    val trusted = intent?.getBooleanExtra(PrayerAzanDelivery.EXTRA_AZAN_TRUSTED, false) == true
    if (intent?.data?.host == "azan" && trusted) {
      window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        // requestDismissKeyguard PIN/құлып сұрайды — азан беті құлып ҮСТІНДЕ көрінуі керек.
      } else {
        @Suppress("DEPRECATION")
        window.addFlags(
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )
      }
    } else {
      @Suppress("DEPRECATION")
      window.clearFlags(
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      )
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        setShowWhenLocked(false)
        setTurnScreenOn(false)
      }
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      // JS BackHandler өңдемесе — activity-ді жаппай, фонға жіберу (Android 12+ finish-ден сақтайды).
      if (!moveTaskToBack(false)) {
          super.invokeDefaultOnBackPressed()
      }
  }
}
