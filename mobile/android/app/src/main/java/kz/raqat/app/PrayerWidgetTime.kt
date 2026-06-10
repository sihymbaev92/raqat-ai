package kz.raqat.app

import java.util.Calendar

internal object PrayerWidgetTime {
  fun formatHms(totalSec: Int): String {
    val s = totalSec.coerceAtLeast(0)
    val h = s / 3600
    val m = (s % 3600) / 60
    val sec = s % 60
    return "%02d:%02d:%02d".format(h, m, sec)
  }

  fun secondsUntilNext(rows: List<PrayerRow>, cal: Calendar = Calendar.getInstance()): Int {
    val next = nextRow(rows, cal) ?: return 0
    val m = next.minutesFromMidnight ?: return 0
    val nowSec = cal.get(Calendar.HOUR_OF_DAY) * 3600 +
      cal.get(Calendar.MINUTE) * 60 +
      cal.get(Calendar.SECOND)
    var targetSec = m * 60
    if (targetSec <= nowSec) targetSec += 24 * 3600
    return (targetSec - nowSec).coerceAtLeast(0)
  }

  fun progressPercent(rows: List<PrayerRow>, cal: Calendar = Calendar.getInstance()): Int {
    val times = rows.mapNotNull { it.minutesFromMidnight }.sorted()
    if (times.size < 2) return 0
    val nowM = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val n = times.size
    for (i in 0 until n) {
      val start = times[i]
      val end = if (i + 1 < n) times[i + 1] else times[0] + 24 * 60
      if (i < n - 1) {
        if (nowM >= start && nowM < end) {
          val p = (nowM - start).toFloat() / (end - start).toFloat()
          return (p.coerceIn(0f, 1f) * 100).toInt()
        }
      } else if (nowM >= start) {
        val p = (nowM - start).toFloat() / (end - start).toFloat()
        return (p.coerceIn(0f, 1f) * 100).toInt()
      }
    }
    if (nowM < times[0]) {
      val start = times[n - 1]
      val end = times[0] + 24 * 60
      val p = (nowM + 24 * 60 - start).toFloat() / (end - start).toFloat()
      return (p.coerceIn(0f, 1f) * 100).toInt()
    }
    return 0
  }

  private fun nextRow(rows: List<PrayerRow>, cal: Calendar): PrayerRow? {
    if (rows.isEmpty()) return null
    val valid = rows.mapNotNull { r -> r.minutesFromMidnight?.let { r to it } }
    if (valid.isEmpty()) return null
    val now = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val after = valid.firstOrNull { it.second > now }
    return (after ?: valid.first()).first
  }
}
