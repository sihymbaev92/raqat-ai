import { parseAladhanPayload } from "../prayerTimes";

describe("parseAladhanPayload", () => {
  it("уақыт белгілерін қиып, қаланы мен күнді дұрыс толтырады", () => {
    const payload = {
      data: {
        timings: {
          Fajr: "05:12 (GST)",
          Sunrise: "06:40",
          Dhuhr: "12:15",
          Asr: "15:30",
          Maghrib: "18:00",
          Isha: "19:30",
        },
        date: {
          readable: "19-04-2026",
        },
      },
    };
    const r = parseAladhanPayload(payload, "Almaty", "Kazakhstan");
    expect(r.city).toBe("Almaty");
    expect(r.country).toBe("Kazakhstan");
    expect(r.fajr).toBe("05:12");
    expect(r.sunrise).toBe("06:40");
    expect(r.dhuhr).toBe("12:15");
    expect(r.asr).toBe("15:30");
    expect(r.maghrib).toBe("18:00");
    expect(r.isha).toBe("19:30");
    expect(r.date).toBe("19-04-2026");
    expect(r.error).toBeUndefined();
  });

  it("readable жоқ болса gregorian.date қолданады", () => {
    const payload = {
      data: {
        timings: {
          Fajr: "04:00",
          Sunrise: "",
          Dhuhr: "",
          Asr: "",
          Maghrib: "",
          Isha: "",
        },
        date: {
          gregorian: { date: "2026-04-19" },
        },
      },
    };
    const r = parseAladhanPayload(payload, "A", "B");
    expect(r.date).toBe("2026-04-19");
  });
});
