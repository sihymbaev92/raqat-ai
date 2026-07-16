const fs = require("fs");
const path = require("path");
const { withDangerousMod, withXcodeProject } = require("@expo/config-plugins");
const { addBuildSourceFileToGroup, getProjectName } = require("@expo/config-plugins/build/ios/utils/Xcodeproj");

const CARPLAY_DIR = "native-ios/CarPlay";
const CARPLAY_FILE = "CarPlayQuranManager.swift";

function copyCarPlaySources(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const projectName = getProjectName(projectRoot);
      const appDir = path.join(platformRoot, projectName);
      const carPlayDir = path.join(appDir, "CarPlay");

      fs.mkdirSync(carPlayDir, { recursive: true });
      fs.copyFileSync(
        path.join(projectRoot, CARPLAY_DIR, CARPLAY_FILE),
        path.join(carPlayDir, CARPLAY_FILE)
      );

      return config;
    },
  ]);
}

function linkCarPlayToMainTarget(config) {
  return withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const projectName = getProjectName(projectRoot);
    let project = config.modResults;
    const filepath = path.join(projectName, "CarPlay", CARPLAY_FILE);

    if (!project.hasFile(filepath)) {
      project = addBuildSourceFileToGroup({
        filepath,
        groupName: projectName,
        project,
      });
    }

    config.modResults = project;
    return config;
  });
}

/** Copies checked-in CarPlay sources into the main iOS app target after prebuild. */
function withIosCarPlay(config) {
  config = copyCarPlaySources(config);
  config = linkCarPlayToMainTarget(config);
  return config;
}

module.exports = withIosCarPlay;
