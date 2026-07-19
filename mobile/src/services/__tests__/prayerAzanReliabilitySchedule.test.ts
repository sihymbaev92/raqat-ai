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

  it("rejects when exact alarm is blocked and native scheduled nothing", () => {
    const result = scheduleFullScreenAzanAlarmsForResult(payload, {
      scheduledCount: 0,
      identifiers: [],
      exactAlarmPermissionGranted: false,
    });
    expect(result.accepted).toBe(false);
    expect(result.identifiers.size).toBe(0);
  });

  it("accepts when native alarms were scheduled even if exact-alarm flag is false", () => {
    const result = scheduleFullScreenAzanAlarmsForResult(payload, {
      scheduledCount: 1,
      identifiers: ["test-fajr"],
      exactAlarmPermissionGranted: false,
    });
    expect(result.accepted).toBe(true);
    expect(result.identifiers.has("test-fajr")).toBe(true);
  });

  it("accepts when exact alarm granted", () => {
    const result = scheduleFullScreenAzanAlarmsForResult(payload, {
      scheduledCount: 1,
      identifiers: ["test-fajr"],
      exactAlarmPermissionGranted: true,
    });
    expect(result.accepted).toBe(true);
  });
});
