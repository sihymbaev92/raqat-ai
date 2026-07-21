package kz.raqat.app

import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.util.DisplayMetrics

/**
 * Пайдаланушы «Дисплей өлшемі / Display size» зумын қолданбада өшіру:
 * DP тұрақты densияда қалады — UI толық экранға автоматты сыйып,
 * намаз жолағы мен мәтіндер қиылып қалмайды.
 */
object DisplayMetricsCompat {
  fun wrap(base: Context): Context {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return base
    val stableDpi = DisplayMetrics.DENSITY_DEVICE_STABLE
    if (stableDpi < 120) return base

    val config = Configuration(base.resources.configuration)
    var changed = false
    if (config.densityDpi != stableDpi) {
      config.densityDpi = stableDpi
      changed = true
    }
    // Тым үлкен жүйелік қаріп layout-ты сындырмасын (a11y үшін шектеулі).
    if (config.fontScale > 1.2f) {
      config.fontScale = 1.2f
      changed = true
    }
    if (!changed) return base
    return base.createConfigurationContext(config)
  }
}
