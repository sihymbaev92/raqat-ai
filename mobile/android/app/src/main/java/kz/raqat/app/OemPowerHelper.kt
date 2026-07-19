package kz.raqat.app

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log

/** Samsung / Xiaomi / Huawei / Oppo / Vivo — фон azan + alarm сенімділігі. */
object OemPowerHelper {
  private const val TAG = "OemPowerHelper"

  enum class OemKind {
    GENERIC,
    SAMSUNG,
    XIAOMI,
    HUAWEI,
    HONOR,
    OPPO,
    REALME,
    VIVO,
    ONEPLUS,
    MEIZU,
    TECNO,
    INFINIX,
  }

  fun detectOem(): OemKind {
    val m = (Build.MANUFACTURER ?: "").lowercase()
    val b = (Build.BRAND ?: "").lowercase()
    return when {
      m.contains("samsung") || b.contains("samsung") -> OemKind.SAMSUNG
      m.contains("xiaomi") || m.contains("redmi") || m.contains("poco") ||
        b.contains("xiaomi") || b.contains("redmi") || b.contains("poco") -> OemKind.XIAOMI
      m.contains("huawei") || b.contains("huawei") -> OemKind.HUAWEI
      m.contains("honor") || b.contains("honor") -> OemKind.HONOR
      m.contains("oppo") || b.contains("oppo") -> OemKind.OPPO
      m.contains("realme") || b.contains("realme") -> OemKind.REALME
      m.contains("vivo") || b.contains("vivo") -> OemKind.VIVO
      m.contains("oneplus") || b.contains("oneplus") -> OemKind.ONEPLUS
      m.contains("meizu") || b.contains("meizu") -> OemKind.MEIZU
      m.contains("tecno") || b.contains("tecno") -> OemKind.TECNO
      m.contains("infinix") || b.contains("infinix") -> OemKind.INFINIX
      else -> OemKind.GENERIC
    }
  }

  fun manufacturerLabel(): String = Build.MANUFACTURER ?: "Android"

  fun isIgnoringBatteryOptimizations(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true
    val pm = context.applicationContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
    return pm?.isIgnoringBatteryOptimizations(context.packageName) == true
  }

  /** Жүйелік «Батареяны оңтайландырудан шығару» диалогы. */
  fun requestIgnoreBatteryOptimizations(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false
    if (isIgnoringBatteryOptimizations(context)) return false
    return try {
      val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      true
    } catch (t: Throwable) {
      Log.w(TAG, "REQUEST_IGNORE_BATTERY failed", t)
      openAppDetailsSettings(context)
    }
  }

  fun openAppDetailsSettings(context: Context): Boolean {
    return try {
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      true
    } catch (t: Throwable) {
      Log.w(TAG, "APP_DETAILS failed", t)
      false
    }
  }

  /** OEM-ге тән autostart / фон рұқсат экраны (Samsung — батарея шектеусіз). */
  fun openOemBackgroundSettings(context: Context): Boolean {
    val pkg = context.packageName
    val candidates = mutableListOf<Intent>()

    when (detectOem()) {
      OemKind.XIAOMI -> {
        candidates += componentIntent("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")
        candidates += componentIntent("com.miui.powerkeeper", "com.miui.powerkeeper.ui.HiddenAppsConfigActivity", pkg)
      }
      OemKind.HUAWEI, OemKind.HONOR -> {
        candidates += componentIntent(
          "com.huawei.systemmanager",
          "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"
        )
        candidates += componentIntent(
          "com.huawei.systemmanager",
          "com.huawei.systemmanager.optimize.process.ProtectActivity"
        )
      }
      OemKind.OPPO, OemKind.REALME, OemKind.ONEPLUS -> {
        candidates += componentIntent(
          "com.coloros.safecenter",
          "com.coloros.safecenter.permission.startup.StartupAppListActivity"
        )
        candidates += componentIntent("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity")
        candidates += componentIntent(
          "com.oneplus.security",
          "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity"
        )
      }
      OemKind.VIVO -> {
        candidates += componentIntent(
          "com.vivo.permissionmanager",
          "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"
        )
        candidates += componentIntent(
          "com.iqoo.secure",
          "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"
        )
      }
      OemKind.SAMSUNG -> {
        candidates += componentIntent(
          "com.samsung.android.lool",
          "com.samsung.android.sm.battery.ui.BatteryActivity"
        )
        candidates += componentIntent(
          "com.samsung.android.lool",
          "com.samsung.android.sm.ui.battery.BatteryActivity"
        )
      }
      OemKind.MEIZU -> {
        candidates += componentIntent("com.meizu.safe", "com.meizu.safe.security.SHOW_APPSEC")
      }
      OemKind.TECNO, OemKind.INFINIX -> {
        candidates += componentIntent(
          "com.transsion.phonemanager",
          "com.cyin.himgr.autostart.AutoStartActivity"
        )
      }
      OemKind.GENERIC -> { /* fall through */ }
    }

    candidates += Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    for (intent in candidates) {
      if (tryStartActivity(context, intent)) return true
    }
    return openAppDetailsSettings(context)
  }

  fun oemNeedsBackgroundSetup(): Boolean {
    return when (detectOem()) {
      OemKind.GENERIC -> false
      else -> true
    }
  }

  private fun componentIntent(pkg: String, cls: String, extraPackage: String? = null): Intent {
    return Intent().apply {
      component = ComponentName(pkg, cls)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      if (extraPackage != null) putExtra("package_name", extraPackage)
    }
  }

  private fun tryStartActivity(context: Context, intent: Intent): Boolean {
    return try {
      val pm = context.packageManager
      if (intent.component != null && pm.resolveActivity(intent, 0) == null) return false
      context.startActivity(intent)
      true
    } catch (t: Throwable) {
      Log.d(TAG, "Intent unavailable: ${intent.component ?: intent.action}", t)
      false
    }
  }
}
