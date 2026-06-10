import { buildFullScreenAzanSlots, shouldRoutePrayerSoundToFullScreenAzan } from "../prayerFullScreenAzan";
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
    expect(shouldRoutePrayerSoundToFullScreenAzan(slot({ kind: "salat" }), "adhan_haramain", "ios")).toBe(false);
  });
});
