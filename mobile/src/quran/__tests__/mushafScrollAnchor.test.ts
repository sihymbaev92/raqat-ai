import { pickDominantAyahAboveScrollOffset } from "../mushafScrollAnchor";

describe("pickDominantAyahAboveScrollOffset", () => {
  const ayahs = [{ numberInSurah: 1 }, { numberInSurah: 2 }, { numberInSurah: 3 }];

  it("returns first ayah when scroll is before any measured top", () => {
    expect(pickDominantAyahAboveScrollOffset(ayahs, { 1: 100, 2: 200, 3: 300 }, 0, 50)).toBe(1);
  });

  it("returns last ayah whose top is at or above the lead line", () => {
    expect(pickDominantAyahAboveScrollOffset(ayahs, { 1: 100, 2: 200, 3: 300 }, 150, 50)).toBe(2);
    expect(pickDominantAyahAboveScrollOffset(ayahs, { 1: 100, 2: 200, 3: 300 }, 250, 50)).toBe(3);
  });

  it("uses only measured tops; skips ayahs without layout yet", () => {
    const partial = [{ numberInSurah: 1 }, { numberInSurah: 2 }, { numberInSurah: 3 }];
    expect(pickDominantAyahAboveScrollOffset(partial, { 2: 200 }, 160, 50)).toBe(2);
    expect(pickDominantAyahAboveScrollOffset(partial, { 2: 200 }, 0, 50)).toBe(1);
  });
});
