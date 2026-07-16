import fs from "fs";
import path from "path";

describe("iOS prebuild output (widget extension)", () => {
  const root = process.cwd();
  const iosDir = path.join(root, "ios");
  const pbxproj = path.join(iosDir, "RAHATOMIR.xcodeproj", "project.pbxproj");

  it("generates PrayerWidgetExtension target when ios/ exists", () => {
    if (!fs.existsSync(pbxproj)) {
      // Windows devs regenerate via `npm run prebuild:ios` (Docker).
      return;
    }
    const project = fs.readFileSync(pbxproj, "utf8");
    expect(project).toContain("PrayerWidgetExtension");
    expect(project).toContain("kz.raqat.app.PrayerWidgetExtension");
    expect(project).toContain("../targets/prayer-widget/Info.plist");
    expect(project).toContain("../targets/prayer-widget/generated.entitlements");
  });

  it("links RN bridge and App Group store into the main app target", () => {
    const appDir = path.join(iosDir, "RAHATOMIR");
    if (!fs.existsSync(appDir)) return;

    expect(fs.existsSync(path.join(appDir, "PrayerWidgetModule.swift"))).toBe(true);
    expect(fs.existsSync(path.join(appDir, "PrayerWidgetModule.m"))).toBe(true);
    expect(fs.existsSync(path.join(appDir, "PrayerWidgetStore.swift"))).toBe(true);

    const entitlements = fs.readFileSync(path.join(appDir, "RAHATOMIR.entitlements"), "utf8");
    expect(entitlements).toContain("group.kz.raqat.app");
  });

  it("keeps widget extension entitlements on the prayer-widget target", () => {
    const entitlements = path.join(root, "targets", "prayer-widget", "generated.entitlements");
    if (!fs.existsSync(entitlements)) return;
    const xml = fs.readFileSync(entitlements, "utf8");
    expect(xml).toContain("group.kz.raqat.app");
  });
});
