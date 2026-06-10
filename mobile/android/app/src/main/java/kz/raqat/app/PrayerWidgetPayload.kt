package kz.raqat.app

import android.content.Context
import org.json.JSONObject
import java.util.Calendar
import java.util.regex.Pattern

internal data class PrayerRow(
  val label: String,
  val timeRaw: String,
  val minutesFromMidnight: Int?
)

internal data class PrayerDayParsed(
  val city: String,
  val country: String,
  val date: String,
  val rows: List<PrayerRow>,
  val weatherTempC: Double?,
  val weatherCode: Int?,
  val latitude: Double?,
  val longitude: Double?
) {
  /** Таң, бесін, аср, шам, хуптен — күн шығуынсыз (5 парыз). */
  fun salatRowsFive(): List<PrayerRow> =
    rows.filterIndexed { index, _ -> index != 1 }

  fun nextRow(): PrayerRow? = nextRowAmong(rows)

  /** Келесі парыз (күн шығуын есепке алмайды). */
  fun nextSalatRow(): PrayerRow? = nextRowAmong(salatRowsFive())

  private fun nextRowAmong(subset: List<PrayerRow>): PrayerRow? {
    if (subset.isEmpty()) return null
    val valid = subset.mapNotNull { r -> r.minutesFromMidnight?.let { r to it } }
    if (valid.isEmpty()) return null
    val cal = Calendar.getInstance()
    val now = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val after = valid.firstOrNull { it.second > now }
    return (after ?: valid.first()).first
  }
}

internal object PrayerWidgetPayload {
  private val TIME_HEAD = Pattern.compile("""^(\d{1,2}):(\d{2})""")

  /** Кэш күні бүгінгі жергілікті күннен өзге болса — ескірген деп есептеледі. */
  private fun isPayloadForToday(dateStr: String): Boolean {
    val s = dateStr.trim()
    if (s.isEmpty()) return true
    val cal = Calendar.getInstance()
    val y = cal.get(Calendar.YEAR)
    val m = cal.get(Calendar.MONTH) + 1
    val d = cal.get(Calendar.DAY_OF_MONTH)
    val ddmmyyyy = Regex("""^(\d{1,2})-(\d{1,2})-(\d{4})$""").matchEntire(s)
    if (ddmmyyyy != null) {
      val dd = ddmmyyyy.groupValues[1].toIntOrNull() ?: return true
      val mm = ddmmyyyy.groupValues[2].toIntOrNull() ?: return true
      val yy = ddmmyyyy.groupValues[3].toIntOrNull() ?: return true
      return yy == y && mm == m && dd == d
    }
    val ymd = Regex("""^(\d{4})-(\d{1,2})-(\d{1,2})$""").matchEntire(s)
    if (ymd != null) {
      val yy = ymd.groupValues[1].toIntOrNull() ?: return true
      val mm = ymd.groupValues[2].toIntOrNull() ?: return true
      val dd = ymd.groupValues[3].toIntOrNull() ?: return true
      return yy == y && mm == m && dd == d
    }
    return true
  }

  fun parseMinutes(timeField: String): Int? {
    val head = timeField.trim().split(Regex("\\s+")).firstOrNull() ?: return null
    val m = TIME_HEAD.matcher(head)
    if (!m.find()) return null
    val h = m.group(1).toIntOrNull() ?: return null
    val min = m.group(2).toIntOrNull() ?: return null
    if (h !in 0..23 || min !in 0..59) return null
    return h * 60 + min
  }

  fun parse(context: Context, raw: String?): PrayerDayParsed? {
    if (raw.isNullOrBlank()) return null
    return try {
      val o = JSONObject(raw)
      val city = o.optString("city", "").trim()
      val country = o.optString("country", "").trim()
      val date = o.optString("date", "").trim()
      val f = o.optString("fajr", "").trim()
      val sun = o.optString("sunrise", "").trim()
      val dh = o.optString("dhuhr", "").trim()
      val asr = o.optString("asr", "").trim()
      val mag = o.optString("maghrib", "").trim()
      val isha = o.optString("isha", "").trim()
      val rows = listOf(
        PrayerRow(context.getString(R.string.widget_prayer_row_fajr), f, parseMinutes(f)),
        PrayerRow(context.getString(R.string.widget_prayer_row_sun), sun, parseMinutes(sun)),
        PrayerRow(context.getString(R.string.widget_prayer_row_dhuhr), dh, parseMinutes(dh)),
        PrayerRow(context.getString(R.string.widget_prayer_row_asr), asr, parseMinutes(asr)),
        PrayerRow(context.getString(R.string.widget_prayer_row_maghrib), mag, parseMinutes(mag)),
        PrayerRow(context.getString(R.string.widget_prayer_row_isha), isha, parseMinutes(isha))
      )
      val weatherTempC =
        if (o.has("weatherTempC") && !o.isNull("weatherTempC")) o.optDouble("weatherTempC") else null
      val weatherCode =
        if (o.has("weatherCode") && !o.isNull("weatherCode")) o.optInt("weatherCode") else null
      val latitude =
        if (o.has("latitude") && !o.isNull("latitude")) o.optDouble("latitude") else null
      val longitude =
        if (o.has("longitude") && !o.isNull("longitude")) o.optDouble("longitude") else null
      if (!isPayloadForToday(date)) return null
      PrayerDayParsed(city, country, date, rows, weatherTempC, weatherCode, latitude, longitude)
    } catch (_: Exception) {
      null
    }
  }
}
