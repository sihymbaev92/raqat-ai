import { matchKzCityFromHalalAddress } from "../halalAddressCity";

describe("matchKzCityFromHalalAddress", () => {
  it("prefers city name over district false positive", () => {
    const hit = matchKzCityFromHalalAddress(
      "Астана қаласы, Алматы ауданы, Тәуелсіздік даңғылы, 1"
    );
    expect(hit?.city).toBe("Astana");
  });

  it("matches Almaty city addresses", () => {
    const hit = matchKzCityFromHalalAddress("Алматы қаласы, Абай даңғылы, 10");
    expect(hit?.city).toBe("Almaty");
  });
});
