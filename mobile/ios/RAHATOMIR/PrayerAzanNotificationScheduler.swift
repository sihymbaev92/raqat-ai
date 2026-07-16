import Foundation
import UserNotifications

struct PrayerAzanScheduleResult {
  let scheduledCount: Int
  let identifiers: [String]
  let lastError: String?
  let exactAlarmPermissionGranted: Bool
}

final class PrayerAzanNotificationScheduler {
  static let shared = PrayerAzanNotificationScheduler()

  private let prefsKey = "raqat_ios_prayer_azan_json"
  private let defaults = UserDefaults(suiteName: "group.kz.raqat.app") ?? .standard

  private func soundFileName(for soundId: String) -> String? {
    if soundId == "off" { return nil }
    if soundId == "adhan_haramain" { return "prayer_azan_user_01.mp3" }
    return "prayer_azan_user_01.mp3"
  }

  func scheduleFromJson(_ json: String, completion: @escaping (PrayerAzanScheduleResult) -> Void) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      let authorized =
        settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
      guard authorized else {
        completion(
          PrayerAzanScheduleResult(
            scheduledCount: 0,
            identifiers: [],
            lastError: "notifications_not_authorized",
            exactAlarmPermissionGranted: true
          )
        )
        return
      }
      self.cancelAll {
        self.defaults.set(json, forKey: self.prefsKey)
        self.scheduleParsed(json, completion: completion)
      }
    }
  }

  func cancelAll(completion: (() -> Void)? = nil) {
    let center = UNUserNotificationCenter.current()
    center.getPendingNotificationRequests { requests in
      let ids = requests
        .map(\.identifier)
        .filter { $0.hasPrefix("raqat-prayer-") || $0.hasPrefix("raqat-azan-") }
      center.removePendingNotificationRequests(withIdentifiers: ids)
      completion?()
    }
  }

  func diagnostics(completion: @escaping (PrayerAzanScheduleResult) -> Void) {
    UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
      let ids = requests
        .map(\.identifier)
        .filter { $0.hasPrefix("raqat-prayer-") || $0.hasPrefix("raqat-azan-") }
      completion(
        PrayerAzanScheduleResult(
          scheduledCount: ids.count,
          identifiers: ids,
          lastError: nil,
          exactAlarmPermissionGranted: true
        )
      )
    }
  }

  func scheduleTestAlarm(delaySeconds: Int, completion: @escaping (PrayerAzanScheduleResult) -> Void) {
    let delay = min(600, max(15, delaySeconds))
    let atMillis = Int(Date().timeIntervalSince1970 * 1000) + delay * 1000
    let item: [String: Any] = [
      "identifier": "raqat-azan-qa-test",
      "atMillis": atMillis,
      "label": "Екінті",
      "enteredTitle": "Екінті намазы кірді (QA)",
      "timeShort": "QA",
      "soundId": "adhan_haramain",
      "salatKey": "asr",
    ]
    guard let data = try? JSONSerialization.data(withJSONObject: [item]),
          let json = String(data: data, encoding: .utf8) else {
      completion(
        PrayerAzanScheduleResult(
          scheduledCount: 0,
          identifiers: [],
          lastError: "invalid_test_payload",
          exactAlarmPermissionGranted: true
        )
      )
      return
    }
    scheduleFromJson(json, completion: completion)
  }

  private func scheduleParsed(_ json: String, completion: @escaping (PrayerAzanScheduleResult) -> Void) {
    guard let data = json.data(using: .utf8),
          let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
      completion(
        PrayerAzanScheduleResult(
          scheduledCount: 0,
          identifiers: [],
          lastError: "invalid_json",
          exactAlarmPermissionGranted: true
        )
      )
      return
    }

    let center = UNUserNotificationCenter.current()
    let nowMs = Int(Date().timeIntervalSince1970 * 1000)
    var identifiers: [String] = []
    var pending = arr.count
    var lastError: String? = nil

    if pending == 0 {
      completion(
        PrayerAzanScheduleResult(
          scheduledCount: 0,
          identifiers: [],
          lastError: nil,
          exactAlarmPermissionGranted: true
        )
      )
      return
    }

    let finish: () -> Void = {
      completion(
        PrayerAzanScheduleResult(
          scheduledCount: identifiers.count,
          identifiers: identifiers,
          lastError: lastError,
          exactAlarmPermissionGranted: true
        )
      )
    }

    for (index, item) in arr.enumerated() {
      let atMillis = item["atMillis"] as? Int ?? Int(item["atMillis"] as? Double ?? 0)
      if atMillis <= nowMs {
        pending -= 1
        if pending == 0 { finish() }
        continue
      }
      let identifier = (item["identifier"] as? String) ?? "raqat-prayer-\(index)"
      let label = (item["label"] as? String) ?? "Намаз"
      let enteredTitle = (item["enteredTitle"] as? String) ?? "\(label) намазы кірді"
      let timeShort = (item["timeShort"] as? String) ?? ""
      let salatKey = (item["salatKey"] as? String) ?? ""
      let soundId = (item["soundId"] as? String) ?? "adhan_haramain"

      let content = UNMutableNotificationContent()
      content.title = enteredTitle
      content.body = timeShort.isEmpty ? label : "\(label) · \(timeShort)"
      content.userInfo = [
        "raqatType": "prayer_azan",
        "label": label,
        "enteredTitle": enteredTitle,
        "timeShort": timeShort,
        "salatKey": salatKey,
        "soundId": soundId,
      ]
      if #available(iOS 15.0, *) {
        content.interruptionLevel = .timeSensitive
      }
      if let soundFile = soundFileName(for: soundId) {
        content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: soundFile))
      }

      let date = Date(timeIntervalSince1970: TimeInterval(atMillis) / 1000.0)
      let comps = Calendar.current.dateComponents(
        [.year, .month, .day, .hour, .minute, .second],
        from: date
      )
      let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
      let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)

      center.add(request) { error in
        if let error {
          lastError = error.localizedDescription
        } else {
          identifiers.append(identifier)
        }
        pending -= 1
        if pending == 0 { finish() }
      }
    }
  }
}
