import { scheduleFullScreenAzanAlarmsForResult } from "../prayerFullScreenAzan";

jest.mock("react-native", () => ({
  Platform: { OS: "android", Version: 33 },
}));

describe("scheduleFullScreenAzanAlarmsForResult", () => {
  const payload = [
    {
      identifier: "test-fajr",
      atMillis: Date.now() + 60_000,
      label: "Таң",
      enteredTitle: "Таң намазы кірді",
      timeShort: "05:00",
      salatKey: "fajr",
      soundId: "adhan_haramain" as const,
    },
  ];

  it("rejects schedule when exact alarm permission is blocked on Android 12+", () => {
    const result = scheduleFullScreenAzanAlarmsForResult(payload, {
      scheduledCount: 1,
      identifiers: ["test-fajr"],
      exactAlarmPermissionGranted: false,
      fullScreenIntentPermissionGranted: true,
    });
    expect(result.accepted).toBe(false);
    expect(result.identifiers.size).toBe(0);
  });

  it("accepts when exact alarm granted", () => {
    const result = scheduleFullScreenAzanAlarmsForResult(payload, {
      scheduledCount: 1,
      identifiers: ["test-fajr"],
      exactAlarmPermissionGranted: true,
      fullScreenIntentPermissionGranted: true,
    });
    expect(result.accepted).toBe(true);
  });
});
