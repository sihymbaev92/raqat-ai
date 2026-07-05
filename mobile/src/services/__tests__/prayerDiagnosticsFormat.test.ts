jest.mock("react-native", () => ({
  Platform: { OS: "android", Version: 33 },
}));

import {
  exactAlarmRequiredOnPlatform,
  formatExactAlarmPermissionStatus,
  formatFullScreenIntentPermissionStatus,
  isExactAlarmRelatedError,
  permissionStatusLabel,
} from "../prayerDiagnosticsFormat";

describe("prayerDiagnosticsFormat", () => {
  it("exact alarm not required below API 31", () => {
    const rn = require("react-native") as { Platform: { OS: string; Version: number } };
    rn.Platform.OS = "android";
    rn.Platform.Version = 30;
    expect(exactAlarmRequiredOnPlatform()).toBe(false);
    expect(formatExactAlarmPermissionStatus(false)).toBe("not_required");
    expect(permissionStatusLabel("not_required")).toContain("қажет емес");
  });

  it("exact alarm granted on API 31+", () => {
    const rn = require("react-native") as { Platform: { OS: string; Version: number } };
    rn.Platform.OS = "android";
    rn.Platform.Version = 33;
    expect(exactAlarmRequiredOnPlatform()).toBe(true);
    expect(formatExactAlarmPermissionStatus(true)).toBe("granted");
    expect(formatExactAlarmPermissionStatus(false)).toBe("blocked");
  });

  it("full screen not required below API 34", () => {
    const rn = require("react-native") as { Platform: { OS: string; Version: number } };
    rn.Platform.Version = 33;
    expect(formatFullScreenIntentPermissionStatus(false)).toBe("not_required");
  });

  it("detects stale exact alarm errors", () => {
    expect(isExactAlarmRelatedError("Exact alarm blocked — azan will be late")).toBe(true);
    expect(isExactAlarmRelatedError("network timeout")).toBe(false);
  });
});
