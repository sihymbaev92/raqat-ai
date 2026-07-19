import Foundation
import React
import UIKit
import Security
import CommonCrypto

@objc(PrayerWidget)
class PrayerWidgetModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  private static var secureField: UITextField?

  @objc func setPayload(_ json: String) {
    PrayerWidgetStore.savePayload(json)
  }

  @objc func setQiblaHeading(_ heading: NSNumber) {
    PrayerWidgetStore.saveQiblaHeading(heading.doubleValue)
  }

  @objc func scheduleFullScreenAzanAlarms(
    _ json: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    PrayerAzanNotificationScheduler.shared.scheduleFromJson(json) { result in
      resolve([
        "scheduledCount": result.scheduledCount,
        "identifiers": result.identifiers,
        "lastError": result.lastError as Any,
        "exactAlarmPermissionGranted": result.exactAlarmPermissionGranted,
      ])
    }
  }

  @objc func cancelFullScreenAzanAlarms() {
    PrayerAzanNotificationScheduler.shared.cancelAll()
  }

  @objc func getFullScreenAzanAlarmDiagnostics(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    PrayerAzanNotificationScheduler.shared.diagnostics { result in
      resolve([
        "scheduledCount": result.scheduledCount,
        "identifiers": result.identifiers,
        "lastError": result.lastError as Any,
        "exactAlarmPermissionGranted": result.exactAlarmPermissionGranted,
      ])
    }
  }

  @objc func scheduleTestAzanAlarm(
    _ delaySeconds: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let delay = delaySeconds.intValue
    PrayerAzanNotificationScheduler.shared.scheduleTestAlarm(delaySeconds: delay) { result in
      resolve([
        "scheduledCount": result.scheduledCount,
        "delaySeconds": delay,
        "exactAlarmPermissionGranted": result.exactAlarmPermissionGranted,
        "lastError": result.lastError as Any,
      ])
    }
  }

  @objc func playNativeAzanAudio(_ soundId: String) {
    PrayerAzanNativePlayer.shared.play(soundId: soundId)
  }

  @objc func stopNativeAzanAudio() {
    PrayerAzanNativePlayer.shared.stop()
  }

  @objc func playNativeAzanDuaAudio() {
    PrayerAzanNativePlayer.shared.playDua()
  }

  @objc func getNativeAzanPlaybackStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(PrayerAzanNativePlayer.shared.playbackStatus())
  }

  @objc func getPendingAzanLaunch(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if let pending = PrayerAzanPendingLaunch.read() {
      resolve(pending)
    } else {
      resolve(NSNull())
    }
  }

  @objc func clearPendingAzanLaunch() {
    PrayerAzanPendingLaunch.clear()
  }

  @objc func finishAzanDelivery() {
    PrayerAzanPendingLaunch.clear()
    PrayerAzanNativePlayer.shared.stop()
  }

  @objc func isAzanSessionActive(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let status = PrayerAzanNativePlayer.shared.playbackStatus()
    let playing = (status["isPlaying"] as? Bool) == true
    let completed = (status["completed"] as? Bool) == true
    let dua = (status["isDua"] as? Bool) == true
    let pending = PrayerAzanPendingLaunch.read() != nil
    resolve(playing || completed || dua || pending)
  }

  @objc func requestAlarmKitAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    PrayerAzanNotificationScheduler.shared.requestAlarmKitAuthorization { authorized, state in
      resolve([
        "authorized": authorized,
        "state": state,
      ])
    }
  }

  /// Скриншот / App Switcher превью қорғау (secure text field overlay).
  @objc func setWindowSecure(
    _ enabled: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let on = enabled.boolValue
      if on {
        if Self.secureField == nil {
          let field = UITextField()
          field.isSecureTextEntry = true
          Self.secureField = field
        }
        guard let field = Self.secureField else {
          resolve(false)
          return
        }
        guard let window = Self.keyWindow() else {
          resolve(false)
          return
        }
        if let secureView = field.subviews.first {
          secureView.frame = window.bounds
          secureView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
          secureView.isUserInteractionEnabled = false
          if secureView.superview !== window {
            window.addSubview(secureView)
            window.sendSubviewToBack(secureView)
          }
        }
        resolve(true)
      } else {
        Self.secureField?.subviews.first?.removeFromSuperview()
        Self.secureField = nil
        resolve(true)
      }
    }
  }

  @objc func getDeviceIntegrityReport(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .utility).async {
      resolve(RaqatDeviceIntegrity.report())
    }
  }

  @objc func verifyPinnedHttpsHost(
    _ host: String,
    pinsJson: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .utility).async {
      resolve(RaqatDeviceIntegrity.verifyPinnedHost(host: host, pinsJson: pinsJson))
    }
  }

  private static func keyWindow() -> UIWindow? {
    if #available(iOS 13.0, *) {
      return UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .flatMap { $0.windows }
        .first { $0.isKeyWindow }
    }
    return UIApplication.shared.windows.first { $0.isKeyWindow }
  }
}
