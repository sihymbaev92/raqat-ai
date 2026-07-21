package kz.raqat.app

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Home виджет ауа райы — Open-Meteo, әр 10 минутта (қолданба жабық кезде де).
 */
object PrayerWidgetWeatherRefresh {
  private const val TAG = "PrayerWidgetWeather"
  private const val PREFS = "raqat_prayer_widget"
  private const val KEY_JSON = "json"
  private const val KEY_LAST_WEATHER_AT = "weather_fetched_at_ms"
  private const val INTERVAL_MS = 10L * 60L * 1000L
  private val busy = AtomicBoolean(false)
  private val executor = Executors.newSingleThreadExecutor()

  fun refreshIfDue(context: Context) {
    val app = context.applicationContext
    val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val last = prefs.getLong(KEY_LAST_WEATHER_AT, 0L)
    if (System.currentTimeMillis() - last < INTERVAL_MS) return
    if (!busy.compareAndSet(false, true)) return
    executor.execute {
      try {
        doRefresh(app)
      } catch (t: Throwable) {
        Log.w(TAG, "weather refresh failed", t)
      } finally {
        busy.set(false)
      }
    }
  }

  private fun doRefresh(app: Context) {
    val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_JSON, null) ?: return
    val o = try {
      JSONObject(raw)
    } catch (_: Exception) {
      return
    }
    if (!o.has("latitude") || o.isNull("latitude") || !o.has("longitude") || o.isNull("longitude")) {
      return
    }
    val lat = o.optDouble("latitude")
    val lon = o.optDouble("longitude")
    if (!lat.isFinite() || !lon.isFinite()) return

    val weather = fetchOpenMeteo(lat, lon) ?: return
    o.put("weatherTempC", weather.first)
    o.put("weatherCode", weather.second)
    prefs.edit()
      .putString(KEY_JSON, o.toString())
      .putLong(KEY_LAST_WEATHER_AT, System.currentTimeMillis())
      .apply()
    try {
      PrayerWidgetViews.updateAllWidgets(app)
    } catch (_: Throwable) {
      /* ignore */
    }
  }

  /** @return Pair(tempC, wmoCode) */
  private fun fetchOpenMeteo(lat: Double, lon: Double): Pair<Double, Int>? {
    val url =
      URL(
        "https://api.open-meteo.com/v1/forecast" +
          "?latitude=$lat&longitude=$lon" +
          "&current=temperature_2m,weather_code" +
          "&timezone=auto"
      )
    val conn = (url.openConnection() as HttpURLConnection).apply {
      connectTimeout = 8_000
      readTimeout = 8_000
      requestMethod = "GET"
      instanceFollowRedirects = true
    }
    try {
      if (conn.responseCode !in 200..299) return null
      val body = conn.inputStream.bufferedReader().use { it.readText() }
      val root = JSONObject(body)
      val cur = root.optJSONObject("current") ?: return null
      if (!cur.has("temperature_2m") || cur.isNull("temperature_2m")) return null
      val temp = cur.getDouble("temperature_2m")
      val code = if (cur.has("weather_code") && !cur.isNull("weather_code")) cur.optInt("weather_code") else 0
      return temp to code
    } finally {
      conn.disconnect()
    }
  }
}
