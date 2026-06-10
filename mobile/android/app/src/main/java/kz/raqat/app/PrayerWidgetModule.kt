package kz.raqat.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import org.json.JSONArray

class PrayerWidgetModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "PrayerWidget"

  private val azanDiagPrefs = "raqat_prayer_azan_diag"

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
  fun scheduleFullScreenAzanAlarms(json: String) {
    val ctx = reactApplicationContext.applicationContext
    val prefs = ctx.getSharedPreferences(azanDiagPrefs, android.content.Context.MODE_PRIVATE)
    try {
      PrayerAzanAlarmScheduler.scheduleFromJson(ctx, json)
      val count = try {
        JSONArray(json).length()
      } catch (_: Throwable) {
        -1
      }
      prefs.edit()
        .putInt("scheduled_count", count)
        .remove("last_error")
        .apply()
    } catch (t: Throwable) {
      prefs.edit()
        .putInt("scheduled_count", 0)
        .putString("last_error", t.message ?: t.javaClass.simpleName)
        .apply()
    }
  }

  @ReactMethod
  fun cancelFullScreenAzanAlarms() {
    val ctx = reactApplicationContext.applicationContext
    try {
      PrayerAzanAlarmScheduler.cancelAll(ctx)
    } catch (_: Throwable) {
      /* no-op */
    }
  }

  @ReactMethod
  fun getFullScreenAzanAlarmDiagnostics(promise: Promise) {
    val ctx = reactApplicationContext.applicationContext
    val prefs = ctx.getSharedPreferences(azanDiagPrefs, android.content.Context.MODE_PRIVATE)
    val map = Arguments.createMap()
    map.putInt("scheduledCount", prefs.getInt("scheduled_count", 0))
    map.putString("lastError", prefs.getString("last_error", null))
    promise.resolve(map)
  }
}
