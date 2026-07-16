import Foundation
import React

@objc(PrayerWidget)
class PrayerWidgetModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

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
}
