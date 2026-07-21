import {
  APP_PRAYER_ASR_SCHOOL,
  APP_PRAYER_CALCULATION_METHOD,
  fetchPrayerTimesByCity,
  fetchPrayerTimesByCoordinatesForDate,
  fetchPrayerTimesForLocationForDate,
  isPrayerTimesResultForLocalToday,
  parseAladhanPayload,
  parseMuftyatPrayerRow,
} from "../prayerTimes";

const originalFetch = global.fetch;

const aladhanOkPayload = {
  data: {
    timings: {
      Fajr: "05:12",
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

function mockSuccessfulFetch() {
  const fetchMock = jest.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    return {
      ok: true,
      json: async () => aladhanOkPayload,
    };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

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

  it("координат берілсе нәтижеге сақтайды", () => {
    const r = parseAladhanPayload(aladhanOkPayload, "Shymkent", "Kazakhstan", {
      latitude: 42.34167,
      longitude: 69.59028,
    });
    expect(r.latitude).toBe(42.34167);
    expect(r.longitude).toBe(69.59028);
  });
});

describe("parseMuftyatPrayerRow", () => {
  it("ҚМДБ жылдық кесте жолын қолданба пішініне түсіреді", () => {
    const r = parseMuftyatPrayerRow(
      {
        fajr: "01:54",
        sunrise: "04:06",
        dhuhr: "12:03",
        asr: "17:22",
        maghrib: "19:40",
        isha: "21:51",
        Date: "2026-06-13",
      },
      "Almaty",
      "Kazakhstan",
      { latitude: 43.238293, longitude: 76.945465 }
    );

    expect(r).toMatchObject({
      city: "Almaty",
      country: "Kazakhstan",
      latitude: 43.238293,
      longitude: 76.945465,
      date: "2026-06-13",
      fajr: "01:54",
      sunrise: "04:06",
      dhuhr: "12:03",
      asr: "17:22",
      maghrib: "19:40",
      isha: "21:51",
    });
  });
});

describe("isPrayerTimesResultForLocalToday", () => {
  it("DD-MM-YYYY: сол күн true", () => {
    const now = new Date(2026, 3, 19, 8, 0, 0);
    expect(
      isPrayerTimesResultForLocalToday(
        {
          city: "A",
          country: "B",
          date: "19-04-2026",
          fajr: "05:00",
          sunrise: "06:00",
          dhuhr: "12:00",
          asr: "15:00",
          maghrib: "18:00",
          isha: "19:30",
        },
        now
      )
    ).toBe(true);
  });

  it("DD-MM-YYYY: келесі күн false", () => {
    const now = new Date(2026, 3, 20, 8, 0, 0);
    expect(
      isPrayerTimesResultForLocalToday(
        {
          city: "A",
          country: "B",
          date: "19-04-2026",
          fajr: "05:00",
          sunrise: "06:00",
          dhuhr: "12:00",
          asr: "15:00",
          maghrib: "18:00",
          isha: "19:30",
        },
        now
      )
    ).toBe(false);
  });

  it("YYYY-MM-DD: сол күн true", () => {
    const now = new Date(2026, 3, 19, 23, 59, 0);
    expect(
      isPrayerTimesResultForLocalToday(
        {
          city: "A",
          country: "B",
          date: "2026-04-19",
          fajr: "04:00",
          sunrise: "",
          dhuhr: "",
          asr: "",
          maghrib: "",
          isha: "",
        },
        now
      )
    ).toBe(true);
  });
});

describe("Aladhan calculation profile", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("қаламен сұрағанда Ханафи school және app method жібереді", async () => {
    const fetchMock = mockSuccessfulFetch();

    await fetchPrayerTimesByCity("Shymkent", "Kazakhstan");

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("method")).toBe(String(APP_PRAYER_CALCULATION_METHOD));
    expect(url.searchParams.get("school")).toBe(String(APP_PRAYER_ASR_SCHOOL));
  });

  it("координат және күнмен сұрағанда да Ханафи school сақталады", async () => {
    const fetchMock = mockSuccessfulFetch();

    await fetchPrayerTimesByCoordinatesForDate(42.3417, 69.5901, "Shymkent", "Kazakhstan", new Date(2026, 5, 3));

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("method")).toBe(String(APP_PRAYER_CALCULATION_METHOD));
    expect(url.searchParams.get("school")).toBe(String(APP_PRAYER_ASR_SCHOOL));
  });

  it("координат және күнмен сұрағанда координат result ішінде сақталады", async () => {
    mockSuccessfulFetch();

    await expect(
      fetchPrayerTimesByCoordinatesForDate(42.3417, 69.5901, "Shymkent", "Kazakhstan", new Date(2026, 5, 3))
    ).resolves.toMatchObject({
      latitude: 42.3417,
      longitude: 69.5901,
    });
  });
});

describe("Muftyat official Kazakhstan prayer source", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("Қазақстан қаласына ҚМДБ ресми координатымен кесте сұрайды", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("https://api.muftyat.kz/cities/")) {
        return {
          ok: true,
          json: async () => ({
            results: [
              {
                title: "Шымкент қаласы",
                lat: "42.368009",
                lng: "69.612769",
              },
            ],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          result: [
            {
              fajr: "03:03",
              sunrise: "04:54",
              dhuhr: "12:24",
              asr: "17:16",
              maghrib: "19:48",
              isha: "21:28",
              Date: "2026-06-13",
            },
          ],
        }),
      };
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      fetchPrayerTimesForLocationForDate("Shymkent", "Kazakhstan", new Date(2026, 5, 13))
    ).resolves.toMatchObject({
      date: "2026-06-13",
      fajr: "03:03",
      dhuhr: "12:24",
      asr: "17:16",
      maghrib: "19:48",
      isha: "21:28",
      latitude: 42.368009,
      longitude: 69.612769,
    });

    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://api.muftyat.kz/prayer-times/2026/42.368009/69.612769"
    );
  });

  it("GPS coordsHint болса қала іздемей, сол координатпен ҚМДБ кестесін алады", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("https://api.muftyat.kz/cities/")) {
        throw new Error("city search must not run when coordsHint is set");
      }
      return {
        ok: true,
        json: async () => ({
          result: [
            {
              fajr: "03:10",
              sunrise: "05:00",
              dhuhr: "12:30",
              asr: "17:20",
              maghrib: "19:50",
              isha: "21:30",
              Date: "2026-06-13",
            },
          ],
        }),
      };
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      fetchPrayerTimesForLocationForDate("Құтарыс", "Kazakhstan", new Date(2026, 5, 13), undefined, {
        lat: 42.12,
        lon: 69.88,
      })
    ).resolves.toMatchObject({
      city: "Құтарыс",
      fajr: "03:10",
      latitude: 42.12,
      longitude: 69.88,
      source: "muftyat",
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://api.muftyat.kz/prayer-times/2026/42.12/69.88"
    );
  });
});
