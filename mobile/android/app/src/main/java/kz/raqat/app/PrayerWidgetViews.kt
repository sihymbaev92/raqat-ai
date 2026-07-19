package kz.raqat.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews

object PrayerWidgetViews {
  private fun setWidgetTextColor(rv: RemoteViews, viewId: Int, color: Int) {
    rv.setInt(viewId, "setTextColor", color)
  }

  private const val PREFS = "raqat_prayer_widget"
  private const val KEY_JSON = "json"

  private const val RC_FULL = 10
  private const val RC_NEXT = 11
  private const val RC_STRIP = 12
  private const val RC_MORNING = 13
  private const val RC_EVENING = 14
  private const val RC_TWO_COL = 15
  private const val RC_FIVE_DUAL = 16
  private const val RC_HOME_STRIP = 17

  fun readPayloadJson(context: Context): String? =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_JSON, null)

  private fun bindEmptyState(context: Context, rv: RemoteViews, parsed: PrayerDayParsed?) {
    bindTopBar(context, rv, null)
    if (readPayloadJson(context) != null && parsed == null) {
      rv.setTextViewText(R.id.widget_top_city, context.getString(R.string.widget_prayer_empty))
    }
    bindEmptyGrid(context, rv)
  }

  fun updateAllWidgets(context: Context) {
    val mgr = AppWidgetManager.getInstance(context)
    val app = context.applicationContext
    refresh(mgr, app, PrayerHomeStripWidgetProvider::class.java) { buildHomeStripRemoteViews(it) }
  }

  /** Құбыла heading жаңарғанда — тек home strip (батарея үнемдеу). */
  fun updateHomeStripWidgetsOnly(context: Context) {
    val mgr = AppWidgetManager.getInstance(context)
    val app = context.applicationContext
    refresh(mgr, app, PrayerHomeStripWidgetProvider::class.java) { buildHomeStripRemoteViews(it) }
  }

  /** Құбыла виджеті жойылды — кері санақ орталықта Chronometer арқылы жаңарады. */
  fun updateHomeStripQiblaOnly(context: Context, headingOverride: Float? = null) {
    updateHomeStripWidgetsOnly(context)
  }

  private fun refresh(
    mgr: AppWidgetManager,
    ctx: Context,
    cls: Class<out AppWidgetProvider>,
    build: (Context) -> RemoteViews
  ) {
    val ids = mgr.getAppWidgetIds(ComponentName(ctx, cls))
    if (ids.isEmpty()) return
    val views = build(ctx)
    for (id in ids) {
      mgr.updateAppWidget(id, views)
    }
  }

  private fun widgetCityTitle(context: Context, parsed: PrayerDayParsed?): String {
    val city = parsed?.city?.trim().orEmpty()
    if (city.isNotEmpty()) return city
    return context.getString(R.string.widget_prayer_label)
  }

  private fun bindTopBar(context: Context, rv: RemoteViews, parsed: PrayerDayParsed?) {
    if (parsed == null) {
      rv.setTextViewText(R.id.widget_top_city, context.getString(R.string.widget_prayer_label))
      rv.setViewVisibility(R.id.widget_top_weather_icon, View.GONE)
      rv.setTextViewText(R.id.widget_top_weather_temp, "—°")
      setWidgetTextColor(rv, R.id.widget_top_weather_temp, context.getColor(R.color.widget_prayer_muted))
      return
    }
    rv.setTextViewText(R.id.widget_top_city, widgetCityTitle(context, parsed))
    rv.setTextViewText(R.id.widget_top_weather_icon, weatherGlyph(parsed.weatherCode))
    rv.setViewVisibility(R.id.widget_top_weather_icon, View.VISIBLE)
    rv.setTextViewText(R.id.widget_top_weather_temp, formatWeatherTemp(parsed))
    setWidgetTextColor(rv, R.id.widget_top_weather_temp, weatherColorFor(context, parsed.weatherCode))
  }

  private fun bindEmptyGrid(context: Context, rv: RemoteViews) {
    val cells = sixSalatCells(context, emptyList())
    for (cell in cells) {
      rv.setViewVisibility(cell.containerId, View.VISIBLE)
      rv.setTextViewText(cell.labelId, cell.row.label)
      rv.setTextViewText(cell.timeId, "—")
      rv.setInt(cell.containerId, "setBackgroundResource", 0)
      setWidgetTextColor(rv, cell.labelId, context.getColor(R.color.widget_prayer_text))
      setWidgetTextColor(rv, cell.timeId, context.getColor(R.color.widget_prayer_time_past))
    }
  }

  /** Толық 6 жол: қала|ауа райы, атаулар, уақыттар. */
  fun buildFullRemoteViews(context: Context): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.widget_prayer_times)
    val parsed = PrayerWidgetPayload.parse(context, readPayloadJson(context))
    if (parsed == null) {
      bindEmptyState(context, rv, parsed)
    } else {
      bindTopBar(context, rv, parsed)
      bindSixGrid(context, rv, parsed.rows, parsed.nextRow())
    }
    bindOpenTap(rv, R.id.widget_root, context, RC_FULL)
    return rv
  }

  /** 5×1 (ен): қала|кері санақ|ауа райы, астында 5 парыз. */
  fun buildNextRemoteViews(context: Context): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.widget_prayer_next)
    val parsed = PrayerWidgetPayload.parse(context, readPayloadJson(context))
    if (parsed == null) {
      bindTopBar(context, rv, null)
      bindNextCountdown(rv, null)
      bindEmptyGrid(context, rv)
    } else {
      bindTopBar(context, rv, parsed)
      bindNextCountdown(rv, parsed.salatRowsFive())
      bindSixGrid(context, rv, parsed.rows, parsed.nextSalatRow(), hideSunColumn = true)
    }
    bindOpenTap(rv, R.id.widget_next_root, context, RC_NEXT)
    return rv
  }

  fun buildStripRemoteViews(context: Context): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.widget_prayer_strip)
    val parsed = PrayerWidgetPayload.parse(context, readPayloadJson(context))
    if (parsed == null) {
      bindEmptyState(context, rv, parsed)
    } else {
      bindTopBar(context, rv, parsed)
      bindSixGrid(context, rv, parsed.rows, parsed.nextRow())
    }
    bindOpenTap(rv, R.id.widget_strip_root, context, RC_STRIP)
    return rv
  }

  fun buildMorningRemoteViews(context: Context): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.widget_prayer_morning)
    val parsed = PrayerWidgetPayload.parse(context, readPayloadJson(context))
    if (parsed == null) {
      bindEmptyState(context, rv, parsed)
    } else {
      bindTopBar(context, rv, parsed)
      val sub = parsed.rows.take(3)
      bindSixGrid(context, rv, parsed.rows, nextInSubset(parsed.nextRow(), sub), visibleOnly = setOf(0, 1, 2))
    }
    bindOpenTap(rv, R.id.widget_morning_root, context, RC_MORNING)
    return rv
  }

  fun buildEveningRemoteViews(context: Context): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.widget_prayer_evening)
    val parsed = PrayerWidgetPayload.parse(context, readPayloadJson(context))
    if (parsed == null) {
      bindEmptyState(context, rv, parsed)
    } else {
      bindTopBar(context, rv, parsed)
      val sub = parsed.rows.drop(3).take(3)
      bindSixGrid(context, rv, parsed.rows, nextInSubset(parsed.nextRow(), sub), visibleOnly = setOf(3, 4, 5))
    }
    bindOpenTap(rv, R.id.widget_evening_root, context, RC_EVENING)
    return rv
  }

  fun buildTwoColRemoteViews(context: Context): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.widget_prayer_two_col)
    val parsed = PrayerWidgetPayload.parse(context, readPayloadJson(context))
    if (parsed == null) {
      bindEmptyState(context, rv, parsed)
    } else {
      bindTopBar(context, rv, parsed)
      bindSixGrid(context, rv, parsed.rows, parsed.nextRow())
    }
    bindOpenTap(rv, R.id.widget_cols_root, context, RC_TWO_COL)
    return rv
  }

  fun buildFiveDualRemoteViews(context: Context): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.widget_prayer_five_dual)
    val parsed = PrayerWidgetPayload.parse(context, readPayloadJson(context))
    if (parsed == null) {
      bindEmptyState(context, rv, parsed)
    } else {
      bindTopBar(context, rv, parsed)
      bindSixGrid(context, rv, parsed.rows, parsed.nextSalatRow(), hideSunColumn = true)
    }
    bindOpenTap(rv, R.id.widget_five_dual_root, context, RC_FIVE_DUAL)
    return rv
  }

  /** Басты бет mockup: ауа|қала, 5 намаз қatarы (ақ pill), келесі намаз + санау. */
  fun buildHomeStripRemoteViews(context: Context): RemoteViews {
    val rv = RemoteViews(context.packageName, R.layout.widget_prayer_home_strip)
    val parsed = PrayerWidgetPayload.parse(context, readPayloadJson(context))
    bindHomeBackground(rv, parsed)
    if (parsed == null) {
      bindHomeTopBar(context, rv, null)
      bindFiveStripGrid(context, rv, emptyList(), null)
      if (readPayloadJson(context) != null) {
        rv.setTextViewText(R.id.widget_home_city, context.getString(R.string.widget_prayer_empty))
      }
    } else {
      bindHomeTopBar(context, rv, parsed)
      val next = parsed.nextSalatRow()
      bindFiveStripGrid(context, rv, parsed.rows, next)
    }
    bindOpenTap(rv, R.id.widget_home_strip_root, context, RC_HOME_STRIP)
    return rv
  }

  private fun bindHomeBackground(rv: RemoteViews, parsed: PrayerDayParsed?) {
    rv.setInt(
      R.id.widget_home_strip_root,
      "setBackgroundResource",
      R.drawable.widget_prayer_home_bg_black
    )
  }

  private fun bindHomeCountdown(rv: RemoteViews, salatRows: List<PrayerRow>?) {
    val sec =
      if (salatRows.isNullOrEmpty()) 0
      else PrayerWidgetTime.secondsUntilNext(salatRows)
    if (sec <= 0) {
      rv.setChronometer(R.id.widget_home_countdown, SystemClock.elapsedRealtime(), "00:00:00", false)
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      rv.setChronometerCountDown(R.id.widget_home_countdown, true)
    }
    val base = SystemClock.elapsedRealtime() + sec * 1000L
    rv.setChronometer(R.id.widget_home_countdown, base, "%s", true)
  }

  private fun nextInSubset(next: PrayerRow?, subset: List<PrayerRow>): PrayerRow? =
    next?.takeIf { n -> subset.any { PrayerWidgetRichText.sameRow(it, n) } }

  private data class StripCell(
    val containerId: Int,
    val labelId: Int,
    val timeId: Int,
    val rowIndex: Int,
    val labelRes: Int
  )

  private fun fiveStripCells(): List<StripCell> =
    listOf(
      StripCell(R.id.widget_strip_cell_fajr, R.id.widget_strip_cell_fajr_lbl, R.id.widget_strip_cell_fajr_time, 0, R.string.widget_prayer_row_fajr),
      StripCell(R.id.widget_strip_cell_dhuhr, R.id.widget_strip_cell_dhuhr_lbl, R.id.widget_strip_cell_dhuhr_time, 2, R.string.widget_prayer_row_dhuhr),
      StripCell(R.id.widget_strip_cell_asr, R.id.widget_strip_cell_asr_lbl, R.id.widget_strip_cell_asr_time, 3, R.string.widget_prayer_row_asr),
      StripCell(R.id.widget_strip_cell_maghrib, R.id.widget_strip_cell_maghrib_lbl, R.id.widget_strip_cell_maghrib_time, 4, R.string.widget_prayer_row_maghrib),
      StripCell(R.id.widget_strip_cell_isha, R.id.widget_strip_cell_isha_lbl, R.id.widget_strip_cell_isha_time, 5, R.string.widget_prayer_row_isha)
    )

  private fun bindHomeTopBar(context: Context, rv: RemoteViews, parsed: PrayerDayParsed?) {
    if (parsed == null) {
      rv.setViewVisibility(R.id.widget_home_weather_icon, View.GONE)
      rv.setTextViewText(R.id.widget_home_weather_temp, "—°")
      setWidgetTextColor(rv, R.id.widget_home_weather_temp, context.getColor(R.color.widget_prayer_muted))
      rv.setTextViewText(R.id.widget_home_city, context.getString(R.string.widget_prayer_label))
      rv.setTextViewText(R.id.widget_home_next_kicker, context.getString(R.string.widget_prayer_next_heading))
      rv.setTextViewText(R.id.widget_home_next_line, "—")
      applyHomeTopBarTextSizes(rv)
      bindHomeCountdown(rv, null)
      return
    }
    rv.setTextViewText(R.id.widget_home_weather_icon, weatherGlyph(parsed.weatherCode))
    rv.setViewVisibility(R.id.widget_home_weather_icon, View.VISIBLE)
    rv.setTextViewText(R.id.widget_home_weather_temp, formatWeatherTemp(parsed))
    setWidgetTextColor(rv, R.id.widget_home_weather_temp, weatherColorFor(context, parsed.weatherCode))
    val city = widgetCityTitle(context, parsed)
    rv.setTextViewText(R.id.widget_home_city, city)
    val heading =
      parsed.nextHeading.ifBlank { context.getString(R.string.widget_prayer_next_heading) }
    rv.setTextViewText(R.id.widget_home_next_kicker, heading)
    val next = parsed.nextSalatRow()
    if (next == null) {
      rv.setTextViewText(R.id.widget_home_next_line, "—")
    } else {
      val timeTxt =
        if (next.timeRaw.isBlank()) "—" else PrayerWidgetRichText.timeHead(next.timeRaw)
      rv.setTextViewText(R.id.widget_home_next_line, "${next.label} · $timeTxt")
    }
    applyHomeTopBarTextSizes(rv)
    bindHomeCountdown(rv, parsed.salatRowsFive())
  }

  /** Төбе мәтіні: келесі намаз / қала / ауа — үлкен (бастапқы бетке тиіспейді). */
  private fun applyHomeTopBarTextSizes(rv: RemoteViews) {
    rv.setTextViewTextSize(R.id.widget_home_next_kicker, TypedValue.COMPLEX_UNIT_SP, 13f)
    rv.setTextViewTextSize(R.id.widget_home_next_line, TypedValue.COMPLEX_UNIT_SP, 17f)
    rv.setTextViewTextSize(R.id.widget_home_countdown, TypedValue.COMPLEX_UNIT_SP, 20f)
    rv.setTextViewTextSize(R.id.widget_home_city, TypedValue.COMPLEX_UNIT_SP, 14f)
    rv.setTextViewTextSize(R.id.widget_home_weather_icon, TypedValue.COMPLEX_UNIT_SP, 15f)
    rv.setTextViewTextSize(R.id.widget_home_weather_temp, TypedValue.COMPLEX_UNIT_SP, 15f)
  }

  private fun bindFiveStripGrid(
    context: Context,
    rv: RemoteViews,
    rows: List<PrayerRow>,
    next: PrayerRow?
  ) {
    val activeText = context.getColor(R.color.widget_prayer_strip_active_text)
    val normalText = context.getColor(R.color.widget_prayer_text)
    for (cell in fiveStripCells()) {
      val row =
        if (cell.rowIndex < rows.size) rows[cell.rowIndex]
        else PrayerRow(context.getString(cell.labelRes), "", null)
      val isNext = next != null && PrayerWidgetRichText.sameRow(row, next)
      val timeTxt =
        if (row.timeRaw.isBlank()) "—" else PrayerWidgetRichText.timeHead(row.timeRaw)
      rv.setTextViewText(cell.labelId, row.label.ifBlank { context.getString(cell.labelRes) })
      rv.setTextViewText(cell.timeId, timeTxt)
      // OEM масштабтамасын жеңу — намаз атауы/уақыт үлкен әрі анық
      rv.setTextViewTextSize(cell.labelId, TypedValue.COMPLEX_UNIT_SP, 15f)
      rv.setTextViewTextSize(cell.timeId, TypedValue.COMPLEX_UNIT_SP, 16f)
      if (isNext) {
        rv.setInt(cell.containerId, "setBackgroundResource", R.drawable.widget_prayer_cell_active_white)
        setWidgetTextColor(rv, cell.labelId, activeText)
        setWidgetTextColor(rv, cell.timeId, activeText)
      } else {
        rv.setInt(cell.containerId, "setBackgroundResource", 0)
        setWidgetTextColor(rv, cell.labelId, normalText)
        setWidgetTextColor(rv, cell.timeId, normalText)
      }
    }
  }

  private fun bindNextCountdown(rv: RemoteViews, salatRows: List<PrayerRow>?) {
    val sec =
      if (salatRows.isNullOrEmpty()) 0
      else PrayerWidgetTime.secondsUntilNext(salatRows)
    rv.setTextViewText(
      R.id.widget_next_countdown,
      if (sec <= 0) "00:00:00" else PrayerWidgetTime.formatHms(sec)
    )
  }

  private data class SalatCell(
    val containerId: Int,
    val labelId: Int,
    val timeId: Int,
    val rowIndex: Int,
    val row: PrayerRow
  )

  private fun sixSalatCells(context: Context, rows: List<PrayerRow>): List<SalatCell> {
    fun rowOrEmpty(index: Int, labelRes: Int): PrayerRow {
      if (index < rows.size) return rows[index]
      return PrayerRow(context.getString(labelRes), "", null)
    }
    return listOf(
      SalatCell(R.id.widget_cell_fajr, R.id.widget_cell_fajr_lbl, R.id.widget_cell_fajr_time, 0, rowOrEmpty(0, R.string.widget_prayer_row_fajr)),
      SalatCell(R.id.widget_cell_sun, R.id.widget_cell_sun_lbl, R.id.widget_cell_sun_time, 1, rowOrEmpty(1, R.string.widget_prayer_row_sun)),
      SalatCell(R.id.widget_cell_dhuhr, R.id.widget_cell_dhuhr_lbl, R.id.widget_cell_dhuhr_time, 2, rowOrEmpty(2, R.string.widget_prayer_row_dhuhr)),
      SalatCell(R.id.widget_cell_asr, R.id.widget_cell_asr_lbl, R.id.widget_cell_asr_time, 3, rowOrEmpty(3, R.string.widget_prayer_row_asr)),
      SalatCell(R.id.widget_cell_maghrib, R.id.widget_cell_maghrib_lbl, R.id.widget_cell_maghrib_time, 4, rowOrEmpty(4, R.string.widget_prayer_row_maghrib)),
      SalatCell(R.id.widget_cell_isha, R.id.widget_cell_isha_lbl, R.id.widget_cell_isha_time, 5, rowOrEmpty(5, R.string.widget_prayer_row_isha))
    )
  }

  private fun bindSixGrid(
    context: Context,
    rv: RemoteViews,
    rows: List<PrayerRow>,
    next: PrayerRow?,
    hideSunColumn: Boolean = false,
    visibleOnly: Set<Int>? = null
  ) {
    val now = PrayerWidgetRichText.nowMinutesFromMidnight()
    for (cell in sixSalatCells(context, rows)) {
      val show =
        when {
          hideSunColumn && cell.rowIndex == 1 -> false
          visibleOnly != null -> cell.rowIndex in visibleOnly
          else -> true
        }
      rv.setViewVisibility(cell.containerId, if (show) View.VISIBLE else View.GONE)
      if (!show) continue

      val timeTxt =
        if (cell.row.timeRaw.isBlank()) "—" else PrayerWidgetRichText.timeHead(cell.row.timeRaw)
      rv.setTextViewText(cell.labelId, cell.row.label)
      rv.setTextViewText(cell.timeId, timeTxt)
      val visual =
        when {
          next != null && PrayerWidgetRichText.sameRow(cell.row, next) -> PrayerRowVisual.NEXT
          cell.row.minutesFromMidnight != null && cell.row.minutesFromMidnight < now -> PrayerRowVisual.PAST
          else -> PrayerRowVisual.NORMAL
        }
      if (visual == PrayerRowVisual.NEXT) {
        rv.setInt(cell.containerId, "setBackgroundResource", R.drawable.widget_prayer_cell_next_bg)
      } else {
        rv.setInt(cell.containerId, "setBackgroundResource", 0)
      }
      setWidgetTextColor(rv, cell.labelId, nameColorFor(context, visual))
      setWidgetTextColor(rv, cell.timeId, timeColorFor(context, visual))
    }
  }

  private fun formatWeatherTemp(parsed: PrayerDayParsed): String {
    val temp = parsed.weatherTempC ?: return "—°"
    val r = kotlin.math.round(temp).toInt()
    return if (r > 0) "+${r}°" else "${r}°"
  }

  private fun weatherGlyph(code: Int?): String {
    if (code == null) return "☁️"
    return when (code) {
      0 -> "☀️"
      1, 2, 3 -> "🌤️"
      45, 48 -> "🌫️"
      51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82 -> "🌧️"
      71, 73, 75, 77, 85, 86 -> "❄️"
      95, 96, 99 -> "⛈️"
      else -> "☁️"
    }
  }

  private fun weatherColorFor(context: Context, code: Int?): Int {
    if (code == null) return context.getColor(R.color.widget_prayer_muted)
    return when (code) {
      0 -> context.getColor(R.color.widget_weather_sunny)
      1, 2, 3 -> context.getColor(R.color.widget_weather_cloudy)
      45, 48 -> context.getColor(R.color.widget_weather_fog)
      51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82 -> context.getColor(R.color.widget_weather_rain)
      71, 73, 75, 77, 85, 86 -> context.getColor(R.color.widget_weather_snow)
      95, 96, 99 -> context.getColor(R.color.widget_weather_storm)
      else -> context.getColor(R.color.widget_weather_cloudy)
    }
  }

  private fun nameColorFor(context: Context, v: PrayerRowVisual): Int {
    val res =
      when (v) {
        PrayerRowVisual.PAST -> R.color.widget_prayer_time_past
        PrayerRowVisual.NEXT -> R.color.widget_prayer_next_time_bright
        PrayerRowVisual.NORMAL -> R.color.widget_prayer_text
      }
    return context.getColor(res)
  }

  private fun timeColorFor(context: Context, v: PrayerRowVisual): Int {
    val res =
      when (v) {
        PrayerRowVisual.PAST -> R.color.widget_prayer_time_past
        PrayerRowVisual.NEXT -> R.color.widget_prayer_next_time_bright
        PrayerRowVisual.NORMAL -> R.color.widget_prayer_time_green
      }
    return context.getColor(res)
  }

  private fun bindOpenTap(
    rv: RemoteViews,
    viewId: Int,
    context: Context,
    requestCode: Int,
    uriString: String = "raqat://prayer-times"
  ) {
    val uri = Uri.parse(uriString)
    val click = Intent(Intent.ACTION_VIEW, uri).setPackage(context.packageName)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val pi = PendingIntent.getActivity(context, requestCode, click, flags)
    rv.setOnClickPendingIntent(viewId, pi)
  }
}
