package kz.raqat.app

import android.content.Context
import android.graphics.Typeface
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan
import android.text.style.StyleSpan
import java.util.Calendar

internal enum class PrayerRowVisual {
  PAST,
  NEXT,
  NORMAL,
}

internal object PrayerWidgetRichText {
  fun timeHead(timeField: String): String =
    timeField.trim().split(Regex("\\s+")).firstOrNull().orEmpty()

  fun nowMinutesFromMidnight(): Int {
    val cal = Calendar.getInstance()
    return cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
  }

  fun sameRow(a: PrayerRow?, b: PrayerRow?): Boolean {
    if (a == null || b == null) return false
    return a.label == b.label && a.timeRaw == b.timeRaw
  }

  private fun visualFor(row: PrayerRow, next: PrayerRow?, now: Int): PrayerRowVisual {
    if (next == null) return PrayerRowVisual.NORMAL
    if (sameRow(row, next)) return PrayerRowVisual.NEXT
    val m = row.minutesFromMidnight
    if (m != null && m < now) return PrayerRowVisual.PAST
    return PrayerRowVisual.NORMAL
  }

  private fun nameColor(context: Context, v: PrayerRowVisual): Int {
    val res = when (v) {
      PrayerRowVisual.PAST -> R.color.widget_prayer_time_past
      PrayerRowVisual.NEXT -> R.color.widget_prayer_next_time_bright
      PrayerRowVisual.NORMAL -> R.color.widget_prayer_text
    }
    return context.getColor(res)
  }

  private fun timeColor(context: Context, v: PrayerRowVisual): Int {
    val res = when (v) {
      PrayerRowVisual.PAST -> R.color.widget_prayer_time_past
      PrayerRowVisual.NEXT -> R.color.widget_prayer_next_time_bright
      PrayerRowVisual.NORMAL -> R.color.widget_prayer_time_green
    }
    return context.getColor(res)
  }

  /** Бір баған: әр жолда намаз аты, астында уақыт (қалың ақ мәтін). */
  fun formatRowsBlock(context: Context, rows: List<PrayerRow>, next: PrayerRow?): CharSequence {
    if (rows.isEmpty()) return ""
    val now = nowMinutesFromMidnight()
    val ssb = SpannableStringBuilder()
    for ((idx, row) in rows.withIndex()) {
      if (idx > 0) ssb.append('\n')
      val vis = visualFor(row, next, now)
      val nameStart = ssb.length
      val label = row.label.trim()
      ssb.append(label)
      val nameEnd = ssb.length
      ssb.setSpan(StyleSpan(Typeface.BOLD), nameStart, nameEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      ssb.setSpan(ForegroundColorSpan(nameColor(context, vis)), nameStart, nameEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      ssb.append('\n')
      val timeStr = timeHead(row.timeRaw).ifEmpty { row.timeRaw.trim() }
      val timeStart = ssb.length
      ssb.append(timeStr)
      val timeEnd = ssb.length
      ssb.setSpan(StyleSpan(Typeface.BOLD), timeStart, timeEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      ssb.setSpan(ForegroundColorSpan(timeColor(context, vis)), timeStart, timeEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      if (vis == PrayerRowVisual.NEXT) {
        ssb.setSpan(RelativeSizeSpan(1.12f), nameStart, nameEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        ssb.setSpan(RelativeSizeSpan(1.18f), timeStart, timeEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
    }
    return ssb
  }

  /** Қысқа жол: таң 05:12 · бесін 12:30 … (уақыт қалың ақ). */
  fun formatStripLine(context: Context, rows: List<PrayerRow>, next: PrayerRow?): CharSequence {
    if (rows.isEmpty()) return ""
    val now = nowMinutesFromMidnight()
    val sep = "  ·  "
    val ssb = SpannableStringBuilder()
    for ((i, row) in rows.withIndex()) {
      if (i > 0) {
        val s = ssb.length
        ssb.append(sep)
        ssb.setSpan(
          ForegroundColorSpan(context.getColor(R.color.widget_prayer_time_past)),
          s,
          ssb.length,
          Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
        )
      }
      val vis = visualFor(row, next, now)
      val nameStart = ssb.length
      ssb.append(row.label.trim())
      ssb.setSpan(StyleSpan(Typeface.BOLD), nameStart, ssb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      ssb.setSpan(ForegroundColorSpan(nameColor(context, vis)), nameStart, ssb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      val sp = ssb.length
      ssb.append(' ')
      ssb.setSpan(ForegroundColorSpan(context.getColor(R.color.widget_prayer_time_past)), sp, ssb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      val timeStr = timeHead(row.timeRaw).ifEmpty { row.timeRaw.trim() }
      val timeStart = ssb.length
      ssb.append(timeStr)
      ssb.setSpan(StyleSpan(Typeface.BOLD), timeStart, ssb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      ssb.setSpan(ForegroundColorSpan(timeColor(context, vis)), timeStart, ssb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      if (vis == PrayerRowVisual.NEXT) {
        ssb.setSpan(RelativeSizeSpan(1.08f), timeStart, ssb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
    }
    return ssb
  }
}
