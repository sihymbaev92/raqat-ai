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
}
