import { fetchOpenMeteoCurrent } from "../openMeteoCurrent";
import { getRaqatApiBase } from "../../config/raqatApiBase";

jest.mock("../../config/raqatApiBase", () => ({
  getRaqatApiBase: jest.fn(() => ""),
}));

describe("fetchOpenMeteoCurrent", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    (getRaqatApiBase as jest.Mock).mockReturnValue("");
  });

  it("falls back to current_weather when the current payload is empty", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ current: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            current_weather: {
              temperature: 24.4,
              weathercode: 1,
              is_day: 1,
              time: "2026-06-10T21:00",
            },
          }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchOpenMeteoCurrent(42.34167, 69.59028)).resolves.toEqual({
      tempC: 24.4,
      wmoCode: 1,
      isDay: true,
      observedAt: "2026-06-10T21:00",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("current_weather=true");
  });

  it("falls back to the Raqat weather proxy when Open-Meteo is unavailable", async () => {
    (getRaqatApiBase as jest.Mock).mockReturnValue("https://api.rahatomir.com");
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            tempC: 28.8,
            wmoCode: 0,
            isDay: true,
            observedAt: "2026-06-11T18:30",
          }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchOpenMeteoCurrent(42.34167, 69.59028)).resolves.toEqual({
      tempC: 28.8,
      wmoCode: 0,
      isDay: true,
      observedAt: "2026-06-11T18:30",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2][0])).toBe(
      "https://api.rahatomir.com/api/v1/weather/current?latitude=42.34167&longitude=69.59028"
    );
  });
});
