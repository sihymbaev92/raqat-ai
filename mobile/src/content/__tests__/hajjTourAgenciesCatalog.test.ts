import { getHajjTourAgencies, HAJJ_TOUR_AGENCIES } from "../hajjTourAgenciesCatalog";

describe("hajjTourAgenciesCatalog", () => {
  it("agency ids are unique when catalog is non-empty", () => {
    const ids = HAJJ_TOUR_AGENCIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getHajjTourAgencies returns sorted copy", () => {
    const a = getHajjTourAgencies();
    const b = getHajjTourAgencies();
    expect(a).toEqual(b);
    expect(a).not.toBe(HAJJ_TOUR_AGENCIES);
  });
});
