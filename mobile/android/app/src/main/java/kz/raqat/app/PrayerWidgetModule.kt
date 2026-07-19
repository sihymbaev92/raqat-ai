package kz.raqat.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings

class PrayerWidgetModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "PrayerWidget"

  private val azanDiagPrefs = "raqat_prayer_azan_diag"
  private val keyScheduledCount = "scheduled_count"
  private val keyLastError = "last_error"
  private val keyExactAlarmPermissionGranted = "exact_alarm_permission_granted"
  private var deviceHeadingActive = false

  companion object {
    const val EVENT_DEVICE_HEADING = "QiblaDeviceHeading"
    @Volatile
    private var officialSiteWarmupWebView: android.webkit.WebView? = null
  }

  private fun sendDeviceHeading(headingMagneticDeg: Float, sensorAccuracy: Int) {
    if (!headingMagneticDeg.isFinite()) return
    try {
      val payload = Arguments.createMap()
      payload.putDouble("heading", headingMagneticDeg.toDouble())
      payload.putInt("accuracy", sensorAccuracy)
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(EVENT_DEVICE_HEADING, payload)
    } catch (_: Throwable) {
      /* bridge may be torn down */
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    /* NativeEventEmitter */
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    /* NativeEventEmitter */
  }

  @ReactMethod
  fun startDeviceHeadingUpdates(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    val started =
      QiblaDeviceHeadingWatcher.start(ctx) { heading, accuracy ->
        sendDeviceHeading(heading, accuracy)
      }
    deviceHeadingActive = started
    if (started) {
      promise.resolve(true)
    } else {
      promise.reject("ERR_QIBLA_HEADING", "Device heading sensors unavailable")
    }
  }

  @ReactMethod
  fun stopDeviceHeadingUpdates() {
    deviceHeadingActive = false
    QiblaDeviceHeadingWatcher.stop()
  }

  /**
   * WMM (Android GeomagneticField): магниттік деклинация, шығыс оң (°).
   * trueHeading ≈ magHeading + declination.
   */
  @ReactMethod
  fun getMagneticDeclinationEastDeg(lat: Double, lng: Double, promise: Promise) {
    if (!lat.isFinite() || !lng.isFinite() || lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
      promise.reject("ERR_DECL", "Invalid coordinates")
      return
    }
    try {
      val field =
        android.hardware.GeomagneticField(
          lat.toFloat(),
          lng.toFloat(),
          0f,
          System.currentTimeMillis()
        )
      val decl = field.declination.toDouble()
      if (!decl.isFinite()) {
        promise.reject("ERR_DECL", "Declination unavailable")
        return
      }
      promise.resolve(decl)
    } catch (t: Throwable) {
      promise.reject("ERR_DECL", t.message, t)
    }
  }

  override fun invalidate() {
    if (deviceHeadingActive) {
      QiblaDeviceHeadingWatcher.stop()
      deviceHeadingActive = false
    }
    super.invalidate()
  }

  @ReactMethod
  fun setQiblaHeading(heading: Double) {
    if (!heading.isFinite()) return
    val ctx = reactApplicationContext.applicationContext
    val h = heading.toFloat()
    QiblaWidgetHelper.saveHeading(ctx, h)
    try {
      PrayerWidgetViews.updateHomeStripWidgetsOnly(ctx)
    } catch (_: Throwable) {
      /* JS қабатты құлатпау */
    }
  }

  @ReactMethod
  fun setPayload(json: String) {
    val ctx = reactApplicationContext.applicationContext
    ctx.getSharedPreferences("raqat_prayer_widget", android.content.Context.MODE_PRIVATE)
      .edit()
      .putString("json", json)
      .apply()
    try {
      PrayerWidgetViews.updateAllWidgets(ctx)
      PrayerWidgetAlarmScheduler.scheduleNext(ctx)
    } catch (_: Throwable) {
      /* виджет жаңарту — JS қабатты құлатпау */
    }
  }

  @ReactMethod
  fun scheduleTestAzanAlarm(delaySeconds: Int, promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    val prefs = ctx.getSharedPreferences(azanDiagPrefs, android.content.Context.MODE_PRIVATE)
    try {
      val result = PrayerAzanAlarmScheduler.scheduleTestAlarm(ctx, delaySeconds)
      val response = Arguments.createMap().apply {
        putInt("scheduledCount", result.scheduledCount)
        putBoolean("exactAlarmPermissionGranted", result.exactAlarmPermissionGranted)
        putInt("delaySeconds", delaySeconds.coerceIn(15, 600))
      }
      val warning = azanPermissionWarning(result)
      prefs.edit()
        .putInt(keyScheduledCount, result.scheduledCount)
        .putBoolean(keyExactAlarmPermissionGranted, result.exactAlarmPermissionGranted)
        .apply {
          if (warning == null) remove(keyLastError) else putString(keyLastError, warning)
        }
        .apply()
      promise.resolve(response)
    } catch (t: Throwable) {
      promise.reject("ERR_AZAN_QA", t)
    }
  }

  @ReactMethod
  fun scheduleFullScreenAzanAlarms(json: String, promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    val prefs = ctx.getSharedPreferences(azanDiagPrefs, android.content.Context.MODE_PRIVATE)
    try {
      val result = PrayerAzanAlarmScheduler.scheduleFromJson(ctx, json)
      val identifiers = Arguments.createArray()
      result.identifiers.forEach { identifiers.pushString(it) }
      val response = Arguments.createMap().apply {
        putInt("scheduledCount", result.scheduledCount)
        putArray("identifiers", identifiers)
        putBoolean("exactAlarmPermissionGranted", result.exactAlarmPermissionGranted)
      }
      val warning = azanPermissionWarning(result)
      prefs.edit()
        .putInt(keyScheduledCount, result.scheduledCount)
        .putBoolean(keyExactAlarmPermissionGranted, result.exactAlarmPermissionGranted)
        .apply {
          if (warning == null) remove(keyLastError) else putString(keyLastError, warning)
        }
        .apply()
      promise.resolve(response)
    } catch (t: Throwable) {
      try {
        PrayerAzanAlarmScheduler.cancelAll(ctx)
      } catch (_: Throwable) {
        // Best-effort cleanup so Expo fallback is not paired with partial native alarms.
      }
      prefs.edit()
        .putInt(keyScheduledCount, 0)
        .putBoolean(keyExactAlarmPermissionGranted, PrayerAzanAlarmScheduler.canScheduleExactAlarms(ctx))
        .putString(keyLastError, t.message ?: t.javaClass.simpleName)
        .apply()
      promise.reject("ERR_AZAN_SCHEDULE", t)
    }
  }

  @ReactMethod
  fun cancelFullScreenAzanAlarms() {
    val ctx = reactApplicationContext.applicationContext
    try {
      PrayerAzanAlarmScheduler.cancelAll(ctx)
      PrayerLegacyNotificationCleaner.clear(ctx)
    } catch (_: Throwable) {
      /* no-op */
    }
  }

  @ReactMethod
  fun getPendingAzanLaunch(promise: Promise) {
    try {
      val pending = PrayerAzanPendingLaunch.read(reactApplicationContext.applicationContext)
      if (pending == null) {
        promise.resolve(null)
        return
      }
      val map = Arguments.createMap()
      pending.forEach { (key, value) -> map.putString(key, value) }
      promise.resolve(map)
    } catch (t: Throwable) {
      promise.reject("ERR_AZAN_PENDING", t)
    }
  }

  @ReactMethod
  fun isAzanSessionActive(promise: Promise) {
    promise.resolve(PrayerAzanActiveSession.isActive(reactApplicationContext.applicationContext))
  }

  @ReactMethod
  fun finishAzanDelivery() {
    val ctx = reactApplicationContext.applicationContext
    try {
      PrayerAzanDelivery.dismissAzanDelivery(ctx)
    } catch (_: Throwable) {
      /* no-op */
    }
    val activity = reactApplicationContext.currentActivity
    if (activity is MainActivity) {
      activity.runOnUiThread { activity.clearAzanLaunchState() }
    }
  }

  @ReactMethod
  fun clearLegacyAzanNotifications() {
    PrayerLegacyNotificationCleaner.clear(reactApplicationContext.applicationContext)
  }

  @ReactMethod
  fun playNativeAzanAudio(soundId: String) {
    PrayerAzanNativePlayer.play(reactApplicationContext.applicationContext, soundId)
  }

  @ReactMethod
  fun stopNativeAzanAudio() {
    PrayerAzanNativePlayer.stop()
  }

  @ReactMethod
  fun playNativeAzanDuaAudio() {
    PrayerAzanNativePlayer.playDua(reactApplicationContext.applicationContext)
  }

  @ReactMethod
  fun getNativeAzanPlaybackStatus(promise: Promise) {
    try {
      val status = PrayerAzanNativePlayer.playbackStatus()
      val map = Arguments.createMap().apply {
        putInt("positionMs", (status["positionMs"] as? Int) ?: 0)
        putInt("durationMs", (status["durationMs"] as? Int) ?: 0)
        putBoolean("isPlaying", status["isPlaying"] == true)
        putBoolean("completed", status["completed"] == true)
        putBoolean("isDua", status["isDua"] == true)
        putBoolean("fullyFinished", status["fullyFinished"] == true)
      }
      promise.resolve(map)
    } catch (t: Throwable) {
      promise.reject("ERR_AZAN_STATUS", t)
    }
  }

  @ReactMethod
  fun getFullScreenAzanAlarmDiagnostics(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    val prefs = ctx.getSharedPreferences(azanDiagPrefs, android.content.Context.MODE_PRIVATE)
    val map = Arguments.createMap()
    val exactAllowed = if (prefs.contains(keyExactAlarmPermissionGranted)) {
      prefs.getBoolean(keyExactAlarmPermissionGranted, false)
    } else {
      PrayerAzanAlarmScheduler.canScheduleExactAlarms(ctx)
    }
    map.putInt("scheduledCount", prefs.getInt(keyScheduledCount, 0))
    map.putString("lastError", prefs.getString(keyLastError, null))
    map.putBoolean("exactAlarmPermissionGranted", exactAllowed)
    map.putBoolean("fullScreenIntentAllowed", PrayerAzanDelivery.canUseFullScreenIntent(ctx))
    promise.resolve(map)
  }

  /** Android 14+: full-screen intent (құлып экранында азан беті) рұқсатын ашу. */
  @ReactMethod
  fun openFullScreenIntentSettings(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        promise.resolve(PrayerAzanDelivery.openFullScreenIntentSettings(ctx))
      } catch (t: Throwable) {
        promise.reject("ERR_FSI_SETTINGS", t.message, t)
      }
    }
  }

  private fun azanPermissionWarning(result: PrayerAzanAlarmScheduler.ScheduleResult): String? {
    if (!result.exactAlarmPermissionGranted) {
      return "Exact alarm permission is blocked; azan will use the best available Android alarm timing"
    }
    return null
  }

  /** Android 12+: дәл уақыт алармы — жүйелік «Рұқсат беру» экранын ашады. */
  @ReactMethod
  fun requestExactAlarmPermissionIfNeeded(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
          promise.resolve(false)
          return@post
        }
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        if (am?.canScheduleExactAlarms() == true) {
          promise.resolve(false)
          return@post
        }
        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
          data = Uri.parse("package:${ctx.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        ctx.startActivity(intent)
        promise.resolve(true)
      } catch (t: Throwable) {
        promise.reject("ERR_EXACT_ALARM", t.message, t)
      }
    }
  }

  /** Батареяны үнемдеу — RAQAT үшін ерекшелік (азан уақытында ояту). */
  @ReactMethod
  fun openBatteryOptimizationSettings(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        val opened = OemPowerHelper.requestIgnoreBatteryOptimizations(ctx)
        promise.resolve(if (opened) "opened" else "already_exempt")
      } catch (t: Throwable) {
        promise.reject("ERR_BATTERY", t.message, t)
      }
    }
  }

  /** Батарея whitelist диалогы — жоқ болса ғана ашады. */
  @ReactMethod
  fun requestIgnoreBatteryOptimizationIfNeeded(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        promise.resolve(OemPowerHelper.requestIgnoreBatteryOptimizations(ctx))
      } catch (t: Throwable) {
        promise.reject("ERR_BATTERY_IGNORE", t.message, t)
      }
    }
  }

  /** Samsung/Xiaomi/Huawei — autostart / фон рұқсат экраны. */
  @ReactMethod
  fun openOemBackgroundSettings(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        promise.resolve(OemPowerHelper.openOemBackgroundSettings(ctx))
      } catch (t: Throwable) {
        promise.reject("ERR_OEM_BG", t.message, t)
      }
    }
  }

  @ReactMethod
  fun getOemPowerDiagnostics(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    try {
      val map = Arguments.createMap().apply {
        putBoolean("batteryOptimizationIgnored", OemPowerHelper.isIgnoringBatteryOptimizations(ctx))
        putString("oemManufacturer", OemPowerHelper.manufacturerLabel())
        putBoolean("oemNeedsBackgroundSetup", OemPowerHelper.oemNeedsBackgroundSetup())
      }
      promise.resolve(map)
    } catch (t: Throwable) {
      promise.reject("ERR_OEM_DIAG", t.message, t)
    }
  }

  /** Ресми сайт WebView — диск кэшін тазалау (жаңа мазмұн үшін). */
  @ReactMethod
  fun warmupOfficialSiteUrls(urls: com.facebook.react.bridge.ReadableArray, promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        val appCtx = ctx.applicationContext
        var wv = officialSiteWarmupWebView
        if (wv == null) {
          wv = android.webkit.WebView(appCtx)
          wv.settings.javaScriptEnabled = true
          wv.settings.domStorageEnabled = true
          wv.settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
          officialSiteWarmupWebView = wv
        }
        for (i in 0 until urls.size()) {
          val url = urls.getString(i)?.trim().orEmpty()
          if (url.isNotEmpty()) {
            wv.loadUrl(url)
          }
        }
        promise.resolve(true)
      } catch (e: Throwable) {
        promise.reject("ERR_WEB_WARMUP", e.message, e)
      }
    }
  }

  /** Ресми сайт WebView — диск кэшін тазалау (жаңа мазмұн үшін). */
  @ReactMethod
  fun clearOfficialSiteWebCache(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        android.webkit.WebStorage.getInstance().deleteAllData()
        val cookieManager = android.webkit.CookieManager.getInstance()
        cookieManager.removeAllCookies(null)
        cookieManager.flush()
        val wv = android.webkit.WebView(ctx)
        wv.clearCache(true)
        wv.clearHistory()
        wv.destroy()
        promise.resolve(true)
      } catch (e: Throwable) {
        promise.reject("ERR_WEB_CACHE", e.message, e)
      }
    }
  }

  /** Логин экрандары: скриншот/жазуды өшіру (FLAG_SECURE). */
  @ReactMethod
  fun setWindowSecure(enabled: Boolean, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    activity.runOnUiThread {
      try {
        if (enabled) {
          activity.window.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
        } else {
          activity.window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
        }
        promise.resolve(true)
      } catch (e: Throwable) {
        promise.reject("ERR_WINDOW_SECURE", e.message, e)
      }
    }
  }

  @ReactMethod
  fun getDeviceIntegrityReport(promise: Promise) {
    try {
      promise.resolve(RaqatDeviceIntegrity.report(reactApplicationContext))
    } catch (e: Throwable) {
      promise.reject("ERR_INTEGRITY", e.message, e)
    }
  }

  @ReactMethod
  fun verifyPinnedHttpsHost(host: String, pinsJson: String, promise: Promise) {
    try {
      val pins = org.json.JSONArray(pinsJson).let { arr ->
        (0 until arr.length()).mapNotNull { i -> arr.optString(i, null)?.takeIf { it.isNotBlank() } }
      }
      promise.resolve(RaqatDeviceIntegrity.verifyPinnedHost(host.trim(), pins))
    } catch (e: Throwable) {
      promise.reject("ERR_TLS_PIN", e.message, e)
    }
  }

  /** Экран сөніп қалмасын (намаз/жетектеу). */
  @ReactMethod
  fun setKeepScreenOn(enabled: Boolean, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    activity.runOnUiThread {
      try {
        if (enabled) {
          activity.window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
          activity.window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        promise.resolve(true)
      } catch (e: Throwable) {
        promise.reject("ERR_KEEP_SCREEN", e.message, e)
      }
    }
  }

  /**
   * Android «экран шектеуі» (screen pinning / Lock Task).
   * Құрылғыда бір рет растау диалогы шығуы мүмкін.
   */
  @ReactMethod
  fun setAppScreenRestriction(enabled: Boolean, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    activity.runOnUiThread {
      try {
        if (enabled) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            activity.startLockTask()
          }
        } else {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
              activity.stopLockTask()
            } catch (_: Throwable) {
              /* already stopped / not in lock task */
            }
          }
        }
        promise.resolve(true)
      } catch (e: Throwable) {
        promise.reject("ERR_SCREEN_RESTRICTION", e.message, e)
      }
    }
  }

  @ReactMethod
  fun isAppScreenRestricted(promise: Promise) {
    try {
      val am =
        reactApplicationContext.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
      val restricted =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          am.lockTaskModeState != android.app.ActivityManager.LOCK_TASK_MODE_NONE
        } else {
          @Suppress("DEPRECATION")
          am.isInLockTaskMode
        }
      promise.resolve(restricted)
    } catch (_: Throwable) {
      promise.resolve(false)
    }
  }

}
