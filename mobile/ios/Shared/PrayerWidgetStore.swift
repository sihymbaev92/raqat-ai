import Foundation
#if canImport(WidgetKit)
import WidgetKit
#endif

enum PrayerWidgetStore {
  static let appGroupId = "group.kz.raqat.app"
  static let payloadKey = "raqat_prayer_widget_payload_v1"
  static let qiblaHeadingKey = "raqat_prayer_widget_qibla_heading_v1"

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  static func savePayload(_ json: String) {
    defaults?.set(json, forKey: payloadKey)
    reloadWidgets()
  }

  static func saveQiblaHeading(_ heading: Double) {
    defaults?.set(heading, forKey: qiblaHeadingKey)
  }

  static func readPayloadJson() -> String? {
    defaults?.string(forKey: payloadKey)
  }

  static func reloadWidgets() {
#if canImport(WidgetKit)
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
#endif
  }
}

struct PrayerWidgetSnapshot: Decodable {
  let city: String
  let country: String
  let date: String
  let fajr: String
  let sunrise: String
  let dhuhr: String
  let asr: String
  let maghrib: String
  let isha: String
  let weatherTempC: Double?

  var salatRows: [(label: String, time: String)] {
    [
      ("Таң", fajr),
      ("Бесін", dhuhr),
      ("Аср", asr),
      ("Ақшам", maghrib),
      ("Құптан", isha),
    ]
  }

  static func parse(from raw: String?) -> PrayerWidgetSnapshot? {
    guard let raw, !raw.isEmpty, let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(PrayerWidgetSnapshot.self, from: data)
  }

  func nextSalat() -> (label: String, time: String)? {
    let cal = Calendar.current
    let now = cal.component(.hour, from: Date()) * 60 + cal.component(.minute, from: Date())
    let parsed = salatRows.compactMap { row -> (String, String, Int)? in
      guard let mins = Self.minutes(from: row.time) else { return nil }
      return (row.label, row.time, mins)
    }
    if parsed.isEmpty { return nil }
    if let hit = parsed.first(where: { $0.2 > now }) {
      return (hit.0, hit.1)
    }
    return (parsed[0].0, parsed[0].1)
  }

  private static func minutes(from timeField: String) -> Int? {
    let head = timeField.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: " ").first.map(String.init) ?? ""
    let parts = head.split(separator: ":")
    guard parts.count >= 2,
          let h = Int(parts[0]),
          let m = Int(parts[1]),
          h >= 0, h <= 23, m >= 0, m <= 59 else { return nil }
    return h * 60 + m
  }
}
