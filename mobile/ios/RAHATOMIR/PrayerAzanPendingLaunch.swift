import Foundation

/// iOS: азан оятқышы / хабарлама ашылғанда RN PrayerAzan экранына параметрлер.
enum PrayerAzanPendingLaunch {
  private static let prefsKey = "raqat_ios_prayer_azan_pending_v1"
  private static let payloadsKey = "raqat_ios_prayer_azan_payloads_v1"
  private static let alarmIdsKey = "raqat_ios_prayer_azan_alarm_ids_v1"
  private static let ttlMs: Int64 = 30 * 60 * 1000

  private static var defaults: UserDefaults {
    UserDefaults(suiteName: "group.kz.raqat.app") ?? .standard
  }

  static func save(
    label: String,
    enteredTitle: String,
    time: String,
    soundId: String,
    salatKey: String
  ) {
    let payload: [String: Any] = [
      "label": label,
      "enteredTitle": enteredTitle,
      "time": time,
      "soundId": soundId,
      "salatKey": salatKey,
      "at_ms": Int64(Date().timeIntervalSince1970 * 1000),
    ]
    defaults.set(payload, forKey: prefsKey)
  }

  static func savePayload(alarmId: String, item: [String: Any]) {
    var all = defaults.dictionary(forKey: payloadsKey) as? [String: [String: Any]] ?? [:]
    all[alarmId] = [
      "label": item["label"] as? String ?? "Намаз",
      "enteredTitle": item["enteredTitle"] as? String ?? "",
      "time": item["timeShort"] as? String ?? "",
      "soundId": item["soundId"] as? String ?? "adhan_haramain",
      "salatKey": item["salatKey"] as? String ?? "",
    ]
    defaults.set(all, forKey: payloadsKey)
  }

  static func saveFromAlarmId(_ alarmId: String) {
    let all = defaults.dictionary(forKey: payloadsKey) as? [String: [String: Any]] ?? [:]
    guard let item = all[alarmId] else { return }
    save(
      label: item["label"] as? String ?? "Намаз",
      enteredTitle: item["enteredTitle"] as? String ?? "",
      time: item["time"] as? String ?? "",
      soundId: item["soundId"] as? String ?? "adhan_haramain",
      salatKey: item["salatKey"] as? String ?? ""
    )
  }

  static func read() -> [String: String]? {
    guard let raw = defaults.dictionary(forKey: prefsKey) else { return nil }
    let label = (raw["label"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    if label.isEmpty {
      clear()
      return nil
    }
    let atMs = (raw["at_ms"] as? Int64) ?? Int64(raw["at_ms"] as? Double ?? 0)
    let now = Int64(Date().timeIntervalSince1970 * 1000)
    if atMs > 0, now - atMs > ttlMs {
      clear()
      return nil
    }
    return [
      "label": label,
      "enteredTitle": (raw["enteredTitle"] as? String) ?? "",
      "time": (raw["time"] as? String) ?? "",
      "soundId": (raw["soundId"] as? String) ?? "adhan_haramain",
      "salatKey": (raw["salatKey"] as? String) ?? "",
    ]
  }

  static func clear() {
    defaults.removeObject(forKey: prefsKey)
  }

  static func replaceAlarmIdMap(_ map: [String: String]) {
    defaults.set(map, forKey: alarmIdsKey)
  }

  static func alarmIdMap() -> [String: String] {
    (defaults.dictionary(forKey: alarmIdsKey) as? [String: String]) ?? [:]
  }

  static func clearPayloadCaches() {
    defaults.removeObject(forKey: payloadsKey)
    defaults.removeObject(forKey: alarmIdsKey)
  }
}
