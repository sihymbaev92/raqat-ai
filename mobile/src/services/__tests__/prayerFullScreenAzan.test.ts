import {
  buildFullScreenAzanSlots,
  prayerAzanParamsFromUrl,
  prayerEnteredTitleForSlot,
  scheduleFullScreenAzanAlarmsForResult,
  scheduleTestAzanAlarmForQa,
  shouldRoutePrayerSoundToFullScreenAzan,
} from "../prayerFullScreenAzan";
import type { PrayerScheduleSlot } from "../prayerNotificationSchedule";

function slot(partial: Partial<PrayerScheduleSlot>): PrayerScheduleSlot {
  return {
    identifier: partial.identifier ?? "raqat-prayer-v2-20260609-fajr",
    when: partial.when ?? new Date("2026-06-09T01:00:00.000Z"),
    salatKey: partial.salatKey ?? "fajr",
    label: partial.label ?? "Таң",
    kind: partial.kind ?? "salat",
    timeShort: partial.timeShort ?? "06:00",
  };
}

describe("prayerFullScreenAzan", () => {
  it("uses the Kazakh Екінті wording for asr entered title", () => {
    expect(prayerEnteredTitleForSlot("Екінті", "asr")).toBe("Екінті намазы кірді");
    expect(prayerEnteredTitleForSlot("Аср", "asr")).toBe("Екінті намазы кірді");
  });

  it("builds payload only for salat slots with enabled adhan sound", () => {
    const slots = [
      slot({ identifier: "fajr", salatKey: "fajr", label: "Таң" }),
      slot({ identifier: "sun", salatKey: "sunrise", label: "Күн", kind: "sun" }),
      slot({ identifier: "dhuhr", salatKey: "dhuhr", label: "Бесін" }),
    ];

    const payload = buildFullScreenAzanSlots(slots, (s) =>
      s.salatKey === "dhuhr" ? "off" : "adhan_haramain"
    );

    expect(payload).toEqual([
      {
        identifier: "fajr",
        atMillis: new Date("2026-06-09T01:00:00.000Z").getTime(),
        label: "Таң",
        enteredTitle: "Таң намазы кірді",
        timeShort: "06:00",
        salatKey: "fajr",
        soundId: "adhan_haramain",
      },
    ]);
  });

  it("routes Android salat adhan playback to the full-screen azan screen", () => {
    expect(shouldRoutePrayerSoundToFullScreenAzan(slot({ kind: "salat" }), "adhan_haramain", "android")).toBe(true);
    expect(shouldRoutePrayerSoundToFullScreenAzan(slot({ kind: "sun" }), "adhan_haramain", "android")).toBe(false);
    expect(shouldRoutePrayerSoundToFullScreenAzan(slot({ kind: "salat" }), "off", "android")).toBe(false);
    expect(shouldRoutePrayerSoundToFullScreenAzan(slot({ kind: "salat" }), "adhan_haramain", "ios")).toBe(true);
  });

  it("accepts native scheduling only when the bridge confirms scheduled alarms", () => {
    const payload = buildFullScreenAzanSlots([slot({ identifier: "fajr" })], () => "adhan_haramain");

    expect(scheduleFullScreenAzanAlarmsForResult(payload, { scheduledCount: 0, identifiers: [] }).accepted).toBe(false);
    expect(scheduleFullScreenAzanAlarmsForResult(payload, undefined).accepted).toBe(false);
    expect(
      scheduleFullScreenAzanAlarmsForResult(payload, { scheduledCount: 1, identifiers: ["fajr"] }).identifiers.has(
        "fajr"
      )
    ).toBe(true);
  });

  it("still accepts native scheduling when alarms were scheduled", () => {
    const payload = buildFullScreenAzanSlots([slot({ identifier: "fajr" })], () => "adhan_haramain");

    expect(
      scheduleFullScreenAzanAlarmsForResult(payload, {
        scheduledCount: 1,
        identifiers: ["fajr"],
      }).accepted
    ).toBe(true);
    expect(
      scheduleFullScreenAzanAlarmsForResult(payload, {
        scheduledCount: 1,
        identifiers: [],
        exactAlarmPermissionGranted: false,
      }).accepted
    ).toBe(true);
    expect(
      scheduleFullScreenAzanAlarmsForResult(payload, {
        scheduledCount: 0,
        identifiers: [],
        exactAlarmPermissionGranted: false,
      }).accepted
    ).toBe(false);
  });

  it("parses azan deep link params from launch url", () => {
    expect(
      prayerAzanParamsFromUrl(
        "raqat://azan?label=Fajr&time=05%3A12&soundId=adhan_haramain&salatKey=fajr&nativeAudio=1"
      )
    ).toMatchObject({
      label: "Fajr",
      time: "05:12",
      soundId: "adhan_haramain",
      salatKey: "fajr",
      nativeAudio: true,
    });
  });

  it("scheduleTestAzanAlarmForQa requires native module on non-android test env", async () => {
    const result = await scheduleTestAzanAlarmForQa(90);
    expect(result.ok).toBe(false);
    expect(["native_module_missing", "schedule_empty"]).toContain(result.error);
  });
});
