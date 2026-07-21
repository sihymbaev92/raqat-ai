package kz.raqat.app

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView

/**
 * Honor/Huawei: құлып үстінде Activity көрінбей қалуы мүмкін.
 * SYSTEM_ALERT_WINDOW бар болса — толық экран overlay (Жабу бар).
 */
object PrayerAzanOverlay {
  private const val TAG = "PrayerAzanOverlay"

  @Volatile private var overlayView: android.view.View? = null

  fun canShow(context: Context): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      Settings.canDrawOverlays(context.applicationContext)
    } else {
      true
    }
  }

  @Synchronized
  fun show(
    context: Context,
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ): Boolean {
    val app = context.applicationContext
    if (!canShow(app)) {
      Log.w(TAG, "SYSTEM_ALERT_WINDOW not granted")
      return false
    }
    hide(app)
    return try {
      val wm = app.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      val view = LayoutInflater.from(app).inflate(R.layout.activity_prayer_azan_lock, null)
      val title =
        enteredTitle.ifBlank { label }.ifBlank { app.getString(R.string.prayer_azan_fullscreen_title) }
      val subtitle =
        if (time.isBlank()) {
          app.getString(R.string.prayer_azan_lock_subtitle)
        } else {
          app.getString(R.string.prayer_azan_lock_subtitle_with_time, time)
        }
      view.findViewById<TextView>(R.id.azanTitle).text = title
      view.findViewById<TextView>(R.id.azanSubtitle).text = subtitle
      view.findViewById<Button>(R.id.azanDismiss).setOnClickListener {
        PrayerAzanDelivery.dismissAzanDelivery(app)
      }
      view.findViewById<Button>(R.id.azanOpenApp).setOnClickListener {
        try {
          app.startActivity(
            PrayerAzanDelivery.azanMainActivityIntent(app, label, enteredTitle, time, soundId, salatKey)
          )
        } catch (t: Throwable) {
          Log.w(TAG, "open app from overlay failed", t)
        }
        hide(app)
      }

      val type =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
          @Suppress("DEPRECATION")
          WindowManager.LayoutParams.TYPE_SYSTEM_ALERT
        }
      @Suppress("DEPRECATION")
      val flags =
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD

      val params =
        WindowManager.LayoutParams(
          WindowManager.LayoutParams.MATCH_PARENT,
          WindowManager.LayoutParams.MATCH_PARENT,
          type,
          flags,
          PixelFormat.TRANSLUCENT
        ).apply {
          gravity = Gravity.CENTER
        }

      wm.addView(view, params)
      overlayView = view
      PrayerAzanActiveSession.markActive(app)
      if (soundId != "off" && !PrayerAzanNativePlayer.isPlaying()) {
        PrayerAzanNativePlayer.play(app, soundId)
      }
      Log.i(TAG, "Azan overlay shown for $salatKey")
      true
    } catch (t: Throwable) {
      Log.w(TAG, "Unable to show azan overlay", t)
      overlayView = null
      false
    }
  }

  @Synchronized
  fun hide(context: Context) {
    val view = overlayView ?: return
    overlayView = null
    try {
      val wm = context.applicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      wm.removeViewImmediate(view)
    } catch (_: Throwable) {
      try {
        val wm = context.applicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        wm.removeView(view)
      } catch (_: Throwable) {
        /* */
      }
    }
  }

  fun isShowing(): Boolean = overlayView != null
}
