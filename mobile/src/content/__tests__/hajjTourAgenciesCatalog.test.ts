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

  it("lists featured partner Niyet first with contact", () => {
    const agencies = getHajjTourAgencies();
    expect(agencies.length).toBeGreaterThan(0);
    expect(agencies[0]?.id).toBe("niyet");
    expect(agencies[0]?.featured).toBe(true);
    expect(agencies[0]?.logoLarge).toBe(true);
    expect(agencies[0]?.instagram).toBe("niyet_hajj_umrah_");
    expect(agencies[0]?.website).toBeUndefined();
  });
});
