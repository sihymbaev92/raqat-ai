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
  private val keyFullScreenIntentPermissionGranted = "full_screen_intent_permission_granted"
  private var deviceHeadingActive = false

  companion object {
    const val EVENT_DEVICE_HEADING = "QiblaDeviceHeading"
  }

  private fun sendDeviceHeading(headingMagneticDeg: Float) {
    if (!headingMagneticDeg.isFinite()) return
    try {
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(EVENT_DEVICE_HEADING, headingMagneticDeg.toDouble())
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
      QiblaDeviceHeadingWatcher.start(ctx) { heading ->
        sendDeviceHeading(heading)
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
      PrayerWidgetViews.updateHomeStripQiblaOnly(ctx, h)
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
      QiblaWidgetSensorService.ensureRunning(ctx)
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
        putBoolean("fullScreenIntentPermissionGranted", result.fullScreenIntentPermissionGranted)
        putInt("delaySeconds", delaySeconds.coerceIn(15, 600))
      }
      val warning = azanPermissionWarning(result)
      prefs.edit()
        .putInt(keyScheduledCount, result.scheduledCount)
        .putBoolean(keyExactAlarmPermissionGranted, result.exactAlarmPermissionGranted)
        .putBoolean(keyFullScreenIntentPermissionGranted, result.fullScreenIntentPermissionGranted)
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
        putBoolean("fullScreenIntentPermissionGranted", result.fullScreenIntentPermissionGranted)
      }
      val warning = azanPermissionWarning(result)
      prefs.edit()
        .putInt(keyScheduledCount, result.scheduledCount)
        .putBoolean(keyExactAlarmPermissionGranted, result.exactAlarmPermissionGranted)
        .putBoolean(keyFullScreenIntentPermissionGranted, result.fullScreenIntentPermissionGranted)
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
        .putBoolean(keyFullScreenIntentPermissionGranted, PrayerAzanAlarmScheduler.canUseFullScreenIntent(ctx))
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
  fun getFullScreenAzanAlarmDiagnostics(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    val prefs = ctx.getSharedPreferences(azanDiagPrefs, android.content.Context.MODE_PRIVATE)
    val map = Arguments.createMap()
    val exactAllowed = if (prefs.contains(keyExactAlarmPermissionGranted)) {
      prefs.getBoolean(keyExactAlarmPermissionGranted, false)
    } else {
      PrayerAzanAlarmScheduler.canScheduleExactAlarms(ctx)
    }
    val fullScreenAllowed = if (prefs.contains(keyFullScreenIntentPermissionGranted)) {
      prefs.getBoolean(keyFullScreenIntentPermissionGranted, false)
    } else {
      PrayerAzanAlarmScheduler.canUseFullScreenIntent(ctx)
    }
    map.putInt("scheduledCount", prefs.getInt(keyScheduledCount, 0))
    map.putString("lastError", prefs.getString(keyLastError, null))
    map.putBoolean("exactAlarmPermissionGranted", exactAllowed)
    map.putBoolean("fullScreenIntentPermissionGranted", fullScreenAllowed)
    promise.resolve(map)
  }

  private fun azanPermissionWarning(result: PrayerAzanAlarmScheduler.ScheduleResult): String? {
    if (!result.fullScreenIntentPermissionGranted) {
      return "Full-screen intent permission is blocked; azan will try direct app launch without notification"
    }
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

  /** Android 14+: құлыпта толық экран азан — жүйелік рұқсат экраны. */
  @ReactMethod
  fun requestFullScreenIntentPermissionIfNeeded(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
          promise.resolve(false)
          return@post
        }
        val mgr = ctx.getSystemService(android.app.NotificationManager::class.java)
        if (mgr?.canUseFullScreenIntent() == true) {
          promise.resolve(false)
          return@post
        }
        val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
          data = Uri.parse("package:${ctx.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        ctx.startActivity(intent)
        promise.resolve(true)
      } catch (t: Throwable) {
        promise.reject("ERR_FULL_SCREEN_INTENT", t.message, t)
      }
    }
  }

  /** Батареяны үнемдеу — RAQAT үшін ерекшелік (азан уақытында ояту). */
  @ReactMethod
  fun openBatteryOptimizationSettings(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          val pm = ctx.getSystemService(Context.POWER_SERVICE) as? PowerManager
          if (pm?.isIgnoringBatteryOptimizations(ctx.packageName) == true) {
            promise.resolve("already_exempt")
            return@post
          }
          val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:${ctx.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          ctx.startActivity(intent)
          promise.resolve("opened")
          return@post
        }
        val listIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        ctx.startActivity(listIntent)
        promise.resolve("list")
      } catch (t: Throwable) {
        try {
          val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:${ctx.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          ctx.startActivity(fallback)
          promise.resolve("app_settings")
        } catch (e: Throwable) {
          promise.reject("ERR_BATTERY", e.message, e)
        }
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

}
