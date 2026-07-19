import Foundation
import UserNotifications
#if canImport(AlarmKit)
import AlarmKit
#endif
#if canImport(ActivityKit)
import ActivityKit
#endif
#if canImport(SwiftUI)
import SwiftUI
#endif

struct PrayerAzanScheduleResult {
  let scheduledCount: Int
  let identifiers: [String]
  let lastError: String?
  let exactAlarmPermissionGranted: Bool
}

#if canImport(AlarmKit)
@available(iOS 26.0, *)
struct PrayerAzanAlarmMetadata: AlarmMetadata {
  var label: String
  var enteredTitle: String
  var timeShort: String
  var salatKey: String
  var soundId: String
}
#endif

final class PrayerAzanNotificationScheduler {
  static let shared = PrayerAzanNotificationScheduler()

  static let categoryId = "RAQAT_PRAYER_AZAN"
  static let openActionId = "OPEN_AZAN"

  private let prefsKey = "raqat_ios_prayer_azan_json"
  private let defaults = UserDefaults(suiteName: "group.kz.raqat.app") ?? .standard
  private var alarmUpdatesStarted = false

  private func soundFileName(for soundId: String) -> String? {
    if soundId == "off" { return nil }
    if soundId == "adhan_haramain" { return "prayer_azan_user_01.mp3" }
    return "prayer_azan_user_01.mp3"
  }

  func registerNotificationCategory() {
    let open = UNNotificationAction(
      identifier: Self.openActionId,
      title: "Азанды ашу",
      options: [.foreground]
    )
    let category = UNNotificationCategory(
      identifier: Self.categoryId,
      actions: [open],
      intentIdentifiers: [],
      options: [.customDismissAction]
    )
    UNUserNotificationCenter.current().setNotificationCategories([category])
    startAlarmKitObserverIfNeeded()
  }

  private func startAlarmKitObserverIfNeeded() {
    #if canImport(AlarmKit)
    if #available(iOS 26.0, *) {
      guard !alarmUpdatesStarted else { return }
      alarmUpdatesStarted = true
      Task {
        for await alarms in AlarmManager.shared.alarmUpdates {
          for alarm in alarms where alarm.state == .alerting {
            PrayerAzanPendingLaunch.saveFromAlarmId(alarm.id.uuidString)
          }
        }
      }
    }
    #endif
  }

  func scheduleFromJson(_ json: String, completion: @escaping (PrayerAzanScheduleResult) -> Void) {
    registerNotificationCategory()
    cancelAll {
      self.defaults.set(json, forKey: self.prefsKey)
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        Task {
          let alarmResult = await self.scheduleWithAlarmKit(json)
          if alarmResult.scheduledCount > 0 {
            completion(alarmResult)
            return
          }
          UNUserNotificationCenter.current().getNotificationSettings { settings in
            let authorized =
              settings.authorizationStatus == .authorized
              || settings.authorizationStatus == .provisional
            guard authorized else {
              completion(
                PrayerAzanScheduleResult(
                  scheduledCount: 0,
                  identifiers: [],
                  lastError: alarmResult.lastError ?? "notifications_not_authorized",
                  exactAlarmPermissionGranted: alarmResult.exactAlarmPermissionGranted
                )
              )
              return
            }
            self.scheduleWithUserNotifications(json, settings: settings) { notifResult in
              if notifResult.scheduledCount > 0 {
                completion(notifResult)
              } else {
                completion(
                  PrayerAzanScheduleResult(
                    scheduledCount: 0,
                    identifiers: [],
                    lastError: alarmResult.lastError ?? notifResult.lastError,
                    exactAlarmPermissionGranted: alarmResult.exactAlarmPermissionGranted
                  )
                )
              }
            }
          }
        }
        return
      }
      #endif
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
        self.scheduleWithUserNotifications(json, settings: settings, completion: completion)
      }
    }
  }

  func cancelAll(completion: (() -> Void)? = nil) {
    let group = DispatchGroup()

    group.enter()
    let center = UNUserNotificationCenter.current()
    center.getPendingNotificationRequests { requests in
      let ids = requests
        .map(\.identifier)
        .filter { $0.hasPrefix("raqat-prayer-") || $0.hasPrefix("raqat-azan-") }
      center.removePendingNotificationRequests(withIdentifiers: ids)
      group.leave()
    }

    group.enter()
    cancelAlarmKitAlarms {
      group.leave()
    }

    group.notify(queue: .main) {
      completion?()
    }
  }

  func diagnostics(completion: @escaping (PrayerAzanScheduleResult) -> Void) {
    UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
      let notifIds = requests
        .map(\.identifier)
        .filter { $0.hasPrefix("raqat-prayer-") || $0.hasPrefix("raqat-azan-") }
      let alarmIds = Array(PrayerAzanPendingLaunch.alarmIdMap().keys)
      let ids = Array(Set(notifIds + alarmIds)).sorted()

      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        let authorized = AlarmManager.shared.authorizationState == .authorized
        completion(
          PrayerAzanScheduleResult(
            scheduledCount: ids.count,
            identifiers: ids,
            lastError: authorized || ids.isEmpty ? nil : "alarmkit_not_authorized",
            exactAlarmPermissionGranted: authorized
          )
        )
        return
      }
      #endif

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

  func requestAlarmKitAuthorization(completion: @escaping (_ authorized: Bool, _ state: String) -> Void) {
    #if canImport(AlarmKit)
    if #available(iOS 26.0, *) {
      Task {
        let manager = AlarmManager.shared
        do {
          var state = manager.authorizationState
          if state == .notDetermined {
            state = try await manager.requestAuthorization()
          }
          let label: String
          switch state {
          case .authorized: label = "authorized"
          case .denied: label = "denied"
          case .notDetermined: label = "notDetermined"
          @unknown default: label = "unknown"
          }
          completion(state == .authorized, label)
        } catch {
          completion(false, "error")
        }
      }
      return
    }
    #endif
    completion(true, "unavailable")
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

  private func cancelAlarmKitAlarms(completion: @escaping () -> Void) {
    #if canImport(AlarmKit)
    if #available(iOS 26.0, *) {
      Task {
        let map = PrayerAzanPendingLaunch.alarmIdMap()
        for uuidString in map.values {
          if let id = UUID(uuidString: uuidString) {
            try? AlarmManager.shared.cancel(id: id)
          }
        }
        PrayerAzanPendingLaunch.clearPayloadCaches()
        completion()
      }
      return
    }
    #endif
    PrayerAzanPendingLaunch.clearPayloadCaches()
    completion()
  }

  #if canImport(AlarmKit)
  @available(iOS 26.0, *)
  private func scheduleWithAlarmKit(_ json: String) async -> PrayerAzanScheduleResult {
    guard let data = json.data(using: .utf8),
          let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
      return PrayerAzanScheduleResult(
        scheduledCount: 0,
        identifiers: [],
        lastError: "invalid_json",
        exactAlarmPermissionGranted: false
      )
    }

    let manager = AlarmManager.shared
    do {
      var auth = manager.authorizationState
      if auth == .notDetermined {
        auth = try await manager.requestAuthorization()
      }
      guard auth == .authorized else {
        return PrayerAzanScheduleResult(
          scheduledCount: 0,
          identifiers: [],
          lastError: "alarmkit_not_authorized",
          exactAlarmPermissionGranted: false
        )
      }
    } catch {
      return PrayerAzanScheduleResult(
        scheduledCount: 0,
        identifiers: [],
        lastError: error.localizedDescription,
        exactAlarmPermissionGranted: false
      )
    }

    let nowMs = Int(Date().timeIntervalSince1970 * 1000)
    var identifiers: [String] = []
    var idMap: [String: String] = [:]
    var lastError: String? = nil

    for (index, item) in arr.enumerated() {
      let atMillis = item["atMillis"] as? Int ?? Int(item["atMillis"] as? Double ?? 0)
      if atMillis <= nowMs { continue }

      let identifier = (item["identifier"] as? String) ?? "raqat-prayer-\(index)"
      let label = (item["label"] as? String) ?? "Намаз"
      let enteredTitle = (item["enteredTitle"] as? String) ?? "\(label) намазы кірді"
      let timeShort = (item["timeShort"] as? String) ?? ""
      let salatKey = (item["salatKey"] as? String) ?? ""
      let soundId = (item["soundId"] as? String) ?? "adhan_haramain"
      if soundId == "off" { continue }

      let alarmId = UUID()
      let date = Date(timeIntervalSince1970: TimeInterval(atMillis) / 1000.0)
      let metadata = PrayerAzanAlarmMetadata(
        label: label,
        enteredTitle: enteredTitle,
        timeShort: timeShort,
        salatKey: salatKey,
        soundId: soundId
      )

      let stopButton = AlarmButton(
        text: "Тоқтату",
        textColor: .white,
        systemImageName: "stop.circle"
      )
      let openButton = AlarmButton(
        text: "Азан",
        textColor: .white,
        systemImageName: "speaker.wave.2.fill"
      )
      let alertPresentation = AlarmPresentation.Alert(
        title: LocalizedStringResource(stringLiteral: enteredTitle),
        stopButton: stopButton,
        secondaryButton: openButton,
        secondaryButtonBehavior: .custom
      )
      let attributes = AlarmAttributes(
        presentation: AlarmPresentation(alert: alertPresentation),
        metadata: metadata,
        tintColor: Color(red: 0.08, green: 0.42, blue: 0.36)
      )
      let openIntent = PrayerAzanOpenIntent(alarmID: alarmId.uuidString)
      let soundName = soundFileName(for: soundId).map { ($0 as NSString).deletingPathExtension }
      let alertSound: AlertConfiguration.AlertSound = {
        if let soundName {
          return .named(soundName)
        }
        return .default
      }()

      do {
        let configuration = AlarmManager.AlarmConfiguration(
          schedule: .fixed(date),
          attributes: attributes,
          secondaryIntent: openIntent,
          sound: alertSound
        )
        _ = try await AlarmManager.shared.schedule(id: alarmId, configuration: configuration)
        identifiers.append(identifier)
        idMap[identifier] = alarmId.uuidString
        PrayerAzanPendingLaunch.savePayload(alarmId: alarmId.uuidString, item: item)
      } catch {
        lastError = error.localizedDescription
      }
    }

    PrayerAzanPendingLaunch.replaceAlarmIdMap(idMap)
    return PrayerAzanScheduleResult(
      scheduledCount: identifiers.count,
      identifiers: identifiers,
      lastError: lastError,
      exactAlarmPermissionGranted: true
    )
  }
  #endif

  private func scheduleWithUserNotifications(
    _ json: String,
    settings: UNNotificationSettings,
    completion: @escaping (PrayerAzanScheduleResult) -> Void
  ) {
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
    let useCritical: Bool = {
      if #available(iOS 12.0, *) {
        return settings.criticalAlertSetting == .enabled
      }
      return false
    }()

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
      content.categoryIdentifier = Self.categoryId
      content.userInfo = [
        "raqatType": "prayer_azan",
        "label": label,
        "enteredTitle": enteredTitle,
        "timeShort": timeShort,
        "salatKey": salatKey,
        "soundId": soundId,
      ]
      if #available(iOS 15.0, *) {
        content.interruptionLevel = useCritical ? .critical : .timeSensitive
        content.relevanceScore = 1.0
      }
      if let soundFile = soundFileName(for: soundId) {
        let name = UNNotificationSoundName(rawValue: soundFile)
        if useCritical, #available(iOS 12.0, *) {
          content.sound = UNNotificationSound.criticalSoundNamed(name)
        } else {
          content.sound = UNNotificationSound(named: name)
        }
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
