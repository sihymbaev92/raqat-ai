const fs = require("fs");
const path = require("path");
const {
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} = require("@expo/config-plugins");
const {
  addBuildSourceFileToGroup,
  addResourceFileToGroup,
  getProjectName,
} = require("@expo/config-plugins/build/ios/utils/Xcodeproj");

const APP_GROUP = "group.kz.raqat.app";
const BRIDGE_DIR = "native-ios/PrayerWidgetBridge";
const SHARED_STORE_SOURCE = "targets/prayer-widget/PrayerWidgetStore.swift";
const AZAN_SOUND_FILES = ["prayer_azan_user_01.mp3", "prayer_azan_dua_01.mp3"];

function ensureAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    const key = "com.apple.security.application-groups";
    const existing = config.modResults[key];
    if (!Array.isArray(existing)) {
      config.modResults[key] = [APP_GROUP];
      return config;
    }
    if (!existing.includes(APP_GROUP)) {
      existing.push(APP_GROUP);
    }
    return config;
  });
}

function copyBridgeNativeFiles(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const projectName = getProjectName(projectRoot);
      const appDir = path.join(platformRoot, projectName);

      fs.mkdirSync(appDir, { recursive: true });

      for (const file of [
        "PrayerWidgetModule.swift",
        "PrayerWidgetModule.m",
        "PrayerAzanNotificationScheduler.swift",
        "PrayerAzanNativePlayer.swift",
        "PrayerAzanPendingLaunch.swift",
        "PrayerAzanOpenIntent.swift",
        "RaqatDeviceIntegrity.swift",
      ]) {
        fs.copyFileSync(path.join(projectRoot, BRIDGE_DIR, file), path.join(appDir, file));
      }

      fs.copyFileSync(
        path.join(projectRoot, SHARED_STORE_SOURCE),
        path.join(appDir, "PrayerWidgetStore.swift")
      );

      for (const sound of AZAN_SOUND_FILES) {
        fs.copyFileSync(
          path.join(projectRoot, "assets", "sounds", sound),
          path.join(appDir, sound)
        );
      }

      return config;
    },
  ]);
}

function linkBridgeSourcesToMainTarget(config) {
  return withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const projectName = getProjectName(projectRoot);
    let project = config.modResults;

    const sourceFiles = [
      path.join(projectName, "PrayerWidgetModule.swift"),
      path.join(projectName, "PrayerWidgetModule.m"),
      path.join(projectName, "PrayerWidgetStore.swift"),
      path.join(projectName, "PrayerAzanNotificationScheduler.swift"),
      path.join(projectName, "PrayerAzanNativePlayer.swift"),
      path.join(projectName, "PrayerAzanPendingLaunch.swift"),
      path.join(projectName, "PrayerAzanOpenIntent.swift"),
      path.join(projectName, "RaqatDeviceIntegrity.swift"),
    ];

    for (const filepath of sourceFiles) {
      if (!project.hasFile(filepath)) {
        project = addBuildSourceFileToGroup({
          filepath,
          groupName: projectName,
          project,
        });
      }
    }

    for (const sound of AZAN_SOUND_FILES) {
      const filepath = path.join(projectName, sound);
      if (!project.hasFile(filepath)) {
        project = addResourceFileToGroup({
          filepath,
          groupName: projectName,
          project,
          isBuildFile: true,
        });
      }
    }

    config.modResults = project;
    return config;
  });
}

/** Links PrayerWidget RN bridge + shared App Group store into the main iOS app target. */
function withIosPrayerWidgetBridge(config) {
  config = ensureAppGroupEntitlement(config);
  config = copyBridgeNativeFiles(config);
  config = linkBridgeSourcesToMainTarget(config);
  return config;
}

module.exports = withIosPrayerWidgetBridge;
