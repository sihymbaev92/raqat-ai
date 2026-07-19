import fs from "fs";
import path from "path";

describe("iOS prayer widget target", () => {
  const root = process.cwd();
  const targetDir = path.join(root, "targets", "prayer-widget");

  it("has apple-targets config and widget sources", () => {
    expect(fs.existsSync(path.join(targetDir, "expo-target.config.js"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "PrayerTimesWidget.swift"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "PrayerWidgetStore.swift"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "Info.plist"))).toBe(true);
  });

  it("registers bridge plugin and app group in app.config.js", () => {
    const appConfig = fs.readFileSync(path.join(root, "app.config.js"), "utf8");
    expect(appConfig).toContain("@bacons/apple-targets");
    expect(appConfig).toContain("./plugins/withIosPrayerWidgetBridge");
    expect(appConfig).toContain("group.kz.raqat.app");
    /** CarPlay — device IPA үшін уақытша өшірулі; қайта қосу кезінде withIosCarPlay. */
    expect(appConfig).toMatch(/withIosCarPlay|CarPlay scene/);
  });

  it("keeps RN bridge sources outside generated ios/", () => {
    const bridgeDir = path.join(root, "native-ios", "PrayerWidgetBridge");
    expect(fs.existsSync(path.join(bridgeDir, "PrayerWidgetModule.swift"))).toBe(true);
    expect(fs.existsSync(path.join(bridgeDir, "PrayerWidgetModule.m"))).toBe(true);
  });

  it("keeps CarPlay sources outside generated ios/", () => {
    const carPlayDir = path.join(root, "native-ios", "CarPlay");
    expect(fs.existsSync(path.join(carPlayDir, "CarPlayQuranManager.swift"))).toBe(true);
  });
});
