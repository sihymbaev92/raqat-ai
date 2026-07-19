import AppIntents
import Foundation

/// AlarmKit құлып экранындағы «Азан» батырмасы — қолданбаны ашып, толық азан дыбысын бастайды.
@available(iOS 26.0, *)
public struct PrayerAzanOpenIntent: LiveActivityIntent {
  public static var title: LocalizedStringResource = "Азанды ашу"
  public static var description = IntentDescription("RAHAT OMIR азан экранын ашады")
  public static var openAppWhenRun: Bool = true

  @Parameter(title: "alarmID")
  public var alarmID: String

  public init(alarmID: String) {
    self.alarmID = alarmID
  }

  public init() {
    self.alarmID = ""
  }

  public func perform() async throws -> some IntentResult {
    if !alarmID.isEmpty {
      PrayerAzanPendingLaunch.saveFromAlarmId(alarmID)
    }
    if let pending = PrayerAzanPendingLaunch.read() {
      let soundId = pending["soundId"] ?? "adhan_haramain"
      await MainActor.run {
        PrayerAzanNativePlayer.shared.play(soundId: soundId)
      }
    }
    return .result()
  }
}
