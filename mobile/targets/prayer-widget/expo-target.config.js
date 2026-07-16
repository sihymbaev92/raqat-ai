/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "PrayerWidgetExtension",
  displayName: "Намаз уақыты",
  deploymentTarget: "15.1",
  bundleIdentifier: ".PrayerWidgetExtension",
  frameworks: ["SwiftUI", "WidgetKit"],
  entitlements: {
    "com.apple.security.application-groups":
      config.ios?.entitlements?.["com.apple.security.application-groups"] ?? [
        "group.kz.raqat.app",
      ],
  },
});
