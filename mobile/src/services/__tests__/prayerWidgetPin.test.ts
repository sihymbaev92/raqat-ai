import { NativeModules, Platform } from "react-native";
import { getPrayerWidgetPinStatus, requestPinPrayerWidget } from "../prayerWidgetPin";

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  NativeModules: {},
}));

describe("prayerWidgetPin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "android";
    delete (NativeModules as { PrayerWidget?: unknown }).PrayerWidget;
  });

  it("getPrayerWidgetPinStatus returns android pin support and count", async () => {
    NativeModules.PrayerWidget = {
      isPrayerWidgetPinSupported: jest.fn(async () => true),
      getPinnedPrayerWidgetCount: jest.fn(async () => 2),
    };
    await expect(getPrayerWidgetPinStatus()).resolves.toEqual({
      platform: "android",
      pinSupported: true,
      pinnedCount: 2,
    });
  });

  it("getPrayerWidgetPinStatus returns ios defaults", async () => {
    Platform.OS = "ios";
    await expect(getPrayerWidgetPinStatus()).resolves.toEqual({
      platform: "ios",
      pinSupported: false,
      pinnedCount: 0,
    });
  });

  it("requestPinPrayerWidget delegates to native on android", async () => {
    const requestPinPrayerHomeStripWidget = jest.fn(async () => true);
    NativeModules.PrayerWidget = { requestPinPrayerHomeStripWidget };
    await expect(requestPinPrayerWidget()).resolves.toBe(true);
    expect(requestPinPrayerHomeStripWidget).toHaveBeenCalled();
  });

  it("requestPinPrayerWidget is false on ios", async () => {
    Platform.OS = "ios";
    await expect(requestPinPrayerWidget()).resolves.toBe(false);
  });
});
