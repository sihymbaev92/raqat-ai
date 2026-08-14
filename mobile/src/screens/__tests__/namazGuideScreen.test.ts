import seedJson from "../../../assets/bundled/hadith-from-db-seed.json";
import { kk } from "../../i18n/kk";

describe("NamazGuideScreen policy", () => {
  it("does not advertise sajda step-by-step companion in study map", () => {
    expect(kk.namazGuide.fivePrayersSub).not.toMatch(/жетектеу/i);
    expect(kk.namazGuide.fivePrayersSub).toMatch(/ниет/i);
  });

  it("removed namazCompanion i18n namespace", () => {
    expect("namazCompanion" in kk).toBe(false);
  });
});

describe("hadith seed after QMDB PDF import", () => {
  it("ships v12+ with 800+ Kazakh Bukhari rows and edition provenance", () => {
    const body = seedJson as {
      version?: number;
      provenance?: { editions?: Record<string, string> };
      hadiths?: Array<{ collection?: string; textKk?: string }>;
    };
    expect(Number(body.version)).toBeGreaterThanOrEqual(12);
    const bukhari = (body.hadiths ?? []).filter((h) => h.collection === "bukhari");
    const withKk = bukhari.filter((h) => (h.textKk ?? "").trim().length > 30);
    expect(withKk.length).toBeGreaterThanOrEqual(800);
    expect(body.provenance?.editions?.ky).toMatch(/HadeethEnc/i);
    expect(body.provenance?.editions?.uz).toMatch(/HadeethEnc/i);
    expect(body.provenance?.editions?.kk).toMatch(/catalog|QMDB|trusted/i);
  });
});
