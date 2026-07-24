import Foundation

/// iOS: азан оятқышы / хабарлама ашылғанда RN PrayerAzan экранына параметрлер.
enum PrayerAzanPendingLaunch {
  private static let prefsKey = "raqat_ios_prayer_azan_pending_v1"
  private static let payloadsKey = "raqat_ios_prayer_azan_payloads_v1"
  private static let alarmIdsKey = "raqat_ios_prayer_azan_alarm_ids_v1"
  private static let suppressAutoPendingUntilKey = "raqat_ios_azan_suppress_auto_pending_until_ms"
  private static let ttlMs: Int64 = 30 * 60 * 1000
  /** Жабудан кейін AlarmKit .alerting observer pending-ті қайта жазбасын. */
  private static let autoPendingSuppressMs: Int64 = 120 * 1000

  private static var defaults: UserDefaults {
    UserDefaults(suiteName: "group.kz.raqat.app") ?? .standard
  }

  private static var nowMs: Int64 {
    Int64(Date().timeIntervalSince1970 * 1000)
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
      "at_ms": nowMs,
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

  /**
   - Parameters:
     - allowDuringSuppress: true — пайдаланушы OpenIntent басқанда (жабу suppress-ін айналып өту).
   */
  static func saveFromAlarmId(_ alarmId: String, allowDuringSuppress: Bool = false) {
    if !allowDuringSuppress, isAutoPendingSuppressed() {
      return
    }
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
    if atMs > 0, nowMs - atMs > ttlMs {
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

  /** Жабу / finish — pending өшіру + авто observer қайта ашпасын. */
  static func clearAfterUserDismiss() {
    clear()
    defaults.set(nowMs + autoPendingSuppressMs, forKey: suppressAutoPendingUntilKey)
  }

  static func isAutoPendingSuppressed() -> Bool {
    let until = (defaults.object(forKey: suppressAutoPendingUntilKey) as? Int64)
      ?? Int64(defaults.double(forKey: suppressAutoPendingUntilKey))
    return until > nowMs
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
