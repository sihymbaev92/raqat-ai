import Foundation
import UIKit
import CommonCrypto
import Darwin

enum RaqatDeviceIntegrity {
  static func report() -> [String: Any] {
    var signals: [String] = []
    let jailbroken = detectJailbreak(&signals)
    let debugger = detectDebugger(&signals)
    let hooking = detectHooking(&signals)
    let emulator = detectSimulator(&signals)
    return [
      "ok": !(jailbroken || debugger || hooking),
      "rootedOrJailbroken": jailbroken,
      "debuggerAttached": debugger,
      "emulator": emulator,
      "hookingSuspected": hooking,
      "signals": Array(Set(signals)),
      "platform": "ios",
    ]
  }

  private static func detectJailbreak(_ signals: inout [String]) -> Bool {
    var hit = false
    let paths = [
      "/Applications/Cydia.app",
      "/Library/MobileSubstrate/MobileSubstrate.dylib",
      "/bin/bash",
      "/usr/sbin/sshd",
      "/etc/apt",
      "/private/var/lib/apt/",
      "/private/var/lib/cydia",
      "/Applications/FakeCarrier.app",
      "/Applications/Icy.app",
      "/Applications/SBSettings.app",
      "/usr/libexec/sftp-server",
      "/usr/bin/ssh",
      "/var/jb",
      "/.bootstrapped",
    ]
    for p in paths {
      if FileManager.default.fileExists(atPath: p) {
        signals.append("path:\(p)")
        hit = true
      }
    }
    let test = "/private/raqat_jb_write_test_\(UUID().uuidString)"
    do {
      try "x".write(toFile: test, atomically: true, encoding: .utf8)
      try? FileManager.default.removeItem(atPath: test)
      signals.append("sandbox_escape_write")
      hit = true
    } catch {
      /* expected */
    }
    return hit
  }

  private static func detectDebugger(_ signals: inout [String]) -> Bool {
    var info = kinfo_proc()
    var size = MemoryLayout<kinfo_proc>.stride
    var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
    let result = sysctl(&mib, u_int(mib.count), &info, &size, nil, 0)
    if result == 0 && (info.kp_proc.p_flag & P_TRACED) != 0 {
      signals.append("p_traced")
      return true
    }
    return false
  }

  private static func detectHooking(_ signals: inout [String]) -> Bool {
    var hit = false
    let dyldCount = _dyld_image_count()
    for i in 0..<dyldCount {
      guard let nameC = _dyld_get_image_name(i) else { continue }
      let name = String(cString: nameC).lowercased()
      if name.contains("frida") || name.contains("cycript") || name.contains("substrate") || name.contains("libhooker") {
        signals.append("dyld_hook")
        hit = true
      }
    }
    return hit
  }

  private static func detectSimulator(_ signals: inout [String]) -> Bool {
    #if targetEnvironment(simulator)
    signals.append("simulator")
    return true
    #else
    return false
    #endif
  }

  /// Leaf X.509 DER SHA-256 pins (`sha256/BASE64`) — Android `certificate.encoded` мен бірдей.
  static func verifyPinnedHost(host: String, pinsJson: String) -> [String: Any] {
    guard let data = pinsJson.data(using: .utf8),
          let arr = try? JSONSerialization.jsonObject(with: data) as? [String] else {
      return ["ok": true, "skipped": true, "matched": false]
    }
    let pins = arr.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { $0.hasPrefix("sha256/") }
    if pins.isEmpty {
      return ["ok": true, "skipped": true, "matched": false]
    }

    let cleaned = host.trimmingCharacters(in: .whitespacesAndNewlines)
    guard let url = URL(string: "https://\(cleaned)/") else {
      return ["ok": false, "skipped": false, "matched": false, "error": "bad_host"]
    }

    let sem = DispatchSemaphore(value: 0)
    var result: [String: Any] = ["ok": false, "skipped": false, "matched": false, "error": "timeout"]
    let lock = NSLock()

    func finish(_ value: [String: Any]) {
      lock.lock()
      defer { lock.unlock() }
      if (result["error"] as? String) == "timeout" || result["matched"] as? Bool == false && result["ok"] as? Bool == false {
        result = value
      }
      sem.signal()
    }

    var req = URLRequest(url: url, timeoutInterval: 12)
    req.httpMethod = "HEAD"

    let delegate = PinSessionDelegate(expectedPins: pins) { matched, err in
      if let err = err {
        finish(["ok": false, "skipped": false, "matched": false, "error": err])
      } else {
        finish(["ok": matched, "skipped": false, "matched": matched])
      }
    }

    let session = URLSession(configuration: .ephemeral, delegate: delegate, delegateQueue: nil)
    let task = session.dataTask(with: req) { _, _, error in
      if let error = error {
        finish(["ok": false, "skipped": false, "matched": false, "error": error.localizedDescription])
      } else {
        // Trust already evaluated in delegate; if still timeout, mark transport ok without pin.
        finish(["ok": false, "skipped": false, "matched": false, "error": "no_pin_callback"])
      }
      session.finishTasksAndInvalidate()
    }
    task.resume()
    _ = sem.wait(timeout: .now() + 15)
    return result
  }
}

private final class PinSessionDelegate: NSObject, URLSessionDelegate {
  private let expectedPins: [String]
  private let onDone: (Bool, String?) -> Void
  private var finished = false

  init(expectedPins: [String], onDone: @escaping (Bool, String?) -> Void) {
    self.expectedPins = expectedPins
    self.onDone = onDone
  }

  func urlSession(
    _ session: URLSession,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
          let trust = challenge.protectionSpace.serverTrust else {
      completionHandler(.performDefaultHandling, nil)
      return
    }

    var matched = false
    let count = SecTrustGetCertificateCount(trust)
    for i in 0..<count {
      guard let cert = SecTrustGetCertificateAtIndex(trust, i) else { continue }
      if let pin = leafCertSha256Pin(cert), expectedPins.contains(pin) {
        matched = true
        break
      }
    }

    if !finished {
      finished = true
      onDone(matched, matched ? nil : "pin_mismatch")
    }

    if matched {
      completionHandler(.useCredential, URLCredential(trust: trust))
    } else {
      completionHandler(.cancelAuthenticationChallenge, nil)
    }
  }
}

private func leafCertSha256Pin(_ cert: SecCertificate) -> String? {
  let der = SecCertificateCopyData(cert) as Data
  var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
  der.withUnsafeBytes { raw in
    _ = CC_SHA256(raw.baseAddress, CC_LONG(der.count), &digest)
  }
  return "sha256/" + Data(digest).base64EncodedString()
}
