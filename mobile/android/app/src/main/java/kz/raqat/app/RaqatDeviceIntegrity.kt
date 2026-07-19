package kz.raqat.app

import android.content.Context
import android.content.pm.ApplicationInfo
import android.os.Build
import android.os.Debug
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.net.InetSocketAddress
import java.net.Socket
import java.net.URL
import java.security.MessageDigest
import java.security.cert.X509Certificate
import javax.net.ssl.HttpsURLConnection

/**
 * Client-side integrity heuristics (root / Frida / debugger / emulator).
 * Complements server auth — reduces casual token theft on compromised devices.
 */
object RaqatDeviceIntegrity {
  fun report(context: Context): WritableMap {
    val signals = mutableListOf<String>()
    val rooted = detectRoot(signals)
    val debugger = detectDebugger(signals)
    val emulator = detectEmulator(signals)
    val hooking = detectHooking(signals)
    val map = Arguments.createMap()
    map.putBoolean("ok", !(rooted || debugger || hooking))
    map.putBoolean("rootedOrJailbroken", rooted)
    map.putBoolean("debuggerAttached", debugger)
    map.putBoolean("emulator", emulator)
    map.putBoolean("hookingSuspected", hooking)
    val signalArr = Arguments.createArray()
    signals.distinct().forEach { signalArr.pushString(it) }
    map.putArray("signals", signalArr)
    map.putString("platform", "android")
    map.putBoolean(
      "debuggableApp",
      (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    )
    return map
  }

  private fun detectRoot(signals: MutableList<String>): Boolean {
    var hit = false
    if (Build.TAGS?.contains("test-keys") == true) {
      signals.add("build_test_keys")
      hit = true
    }
    val paths = arrayOf(
      "/system/app/Superuser.apk",
      "/sbin/su",
      "/system/bin/su",
      "/system/xbin/su",
      "/data/local/xbin/su",
      "/data/local/bin/su",
      "/system/sd/xbin/su",
      "/system/bin/failsafe/su",
      "/data/local/su",
      "/su/bin/su",
      "/system/xbin/daemonsu",
      "/system/etc/init.d/99SuperSUDaemon",
      "/dev/com.koushikdutta.superuser.daemon",
      "/system/app/SuperSU.apk",
      "/system/app/Magisk.apk",
      "/sbin/.magisk",
      "/data/adb/magisk",
      "/data/adb/modules",
    )
    for (p in paths) {
      if (File(p).exists()) {
        signals.add("path:$p")
        hit = true
      }
    }
    try {
      val proc = Runtime.getRuntime().exec(arrayOf("which", "su"))
      val line = BufferedReader(InputStreamReader(proc.inputStream)).readLine()
      if (!line.isNullOrBlank()) {
        signals.add("which_su")
        hit = true
      }
    } catch (_: Throwable) {
    }
    return hit
  }

  private fun detectDebugger(signals: MutableList<String>): Boolean {
    var hit = false
    if (Debug.isDebuggerConnected()) {
      signals.add("debugger_connected")
      hit = true
    }
    if (Debug.waitingForDebugger()) {
      signals.add("waiting_for_debugger")
      hit = true
    }
    return hit
  }

  private fun detectEmulator(signals: MutableList<String>): Boolean {
    val fingerprint = Build.FINGERPRINT.lowercase()
    val model = Build.MODEL.lowercase()
    val product = Build.PRODUCT.lowercase()
    val manufacturer = Build.MANUFACTURER.lowercase()
    val brand = Build.BRAND.lowercase()
    val device = Build.DEVICE.lowercase()
    val hints = listOf(
      fingerprint.contains("generic"),
      fingerprint.contains("emulator"),
      fingerprint.contains("vbox"),
      model.contains("google_sdk"),
      model.contains("emulator"),
      model.contains("android sdk built for"),
      product.contains("sdk"),
      product.contains("emulator"),
      product.contains("google_sdk"),
      manufacturer.contains("genymotion"),
      brand.startsWith("generic") && device.startsWith("generic"),
    )
    if (hints.any { it }) {
      signals.add("emulator_heuristic")
      return true
    }
    return false
  }

  private fun detectHooking(signals: MutableList<String>): Boolean {
    var hit = false
    val fridaPaths = arrayOf(
      "/data/local/tmp/frida-server",
      "/data/local/tmp/re.frida.server",
      "/sbin/frida-server",
    )
    for (p in fridaPaths) {
      if (File(p).exists()) {
        signals.add("frida_path")
        hit = true
      }
    }
    for (port in intArrayOf(27042, 27043)) {
      try {
        Socket().use { s ->
          s.connect(InetSocketAddress("127.0.0.1", port), 80)
          signals.add("frida_port_$port")
          hit = true
        }
      } catch (_: Throwable) {
      }
    }
    try {
      val maps = File("/proc/self/maps").readText()
      if (
        maps.contains("frida", ignoreCase = true) ||
        maps.contains("xposed", ignoreCase = true) ||
        maps.contains("substrate", ignoreCase = true)
      ) {
        signals.add("maps_hook_lib")
        hit = true
      }
    } catch (_: Throwable) {
    }
    return hit
  }

  /** Verify leaf/chain SPKI SHA-256 pins (`sha256/BASE64`). */
  fun verifyPinnedHost(host: String, pins: List<String>): WritableMap {
    val map = Arguments.createMap()
    val normalized = pins.map { it.trim() }.filter { it.startsWith("sha256/") }
    if (normalized.isEmpty()) {
      map.putBoolean("ok", true)
      map.putBoolean("skipped", true)
      map.putBoolean("matched", false)
      return map
    }
    try {
      val url = URL("https://$host/")
      val conn = (url.openConnection() as HttpsURLConnection).apply {
        connectTimeout = 12_000
        readTimeout = 12_000
        instanceFollowRedirects = false
        requestMethod = "HEAD"
      }
      conn.connect()
      val certs = conn.serverCertificates
      conn.disconnect()
      var matched = false
      for (c in certs) {
        if (c !is X509Certificate) continue
        // Leaf/chain X.509 DER SHA-256 — iOS SecCertificateCopyData мен бірдей.
        val digest = MessageDigest.getInstance("SHA-256").digest(c.encoded)
        val pin = "sha256/" + Base64.encodeToString(digest, Base64.NO_WRAP)
        if (normalized.contains(pin)) {
          matched = true
          break
        }
      }
      map.putBoolean("ok", matched)
      map.putBoolean("skipped", false)
      map.putBoolean("matched", matched)
      if (!matched) map.putString("error", "pin_mismatch")
    } catch (e: Throwable) {
      map.putBoolean("ok", false)
      map.putBoolean("skipped", false)
      map.putBoolean("matched", false)
      map.putString("error", e.message ?: "tls_error")
    }
    return map
  }
}
