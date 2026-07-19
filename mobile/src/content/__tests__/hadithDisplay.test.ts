import { setCurrentLocale } from "../../i18n/runtime";
import { kk } from "../../i18n/kk";
import {
  hadithCollectionDisplayName,
  hadithSourceForLocale,
} from "../hadithDisplay";
import type { SahihHadithEntry } from "../../storage/hadithCorpus";

const sample: SahihHadithEntry = {
  id: "bukhari-1",
  collection: "bukhari",
  collectionNameKk: "Сахих әл-Бұхари",
  bookTitleKk: "Book",
  reference: "1",
  arabic: "إنما الأعمال بالنيات",
  textKk: "Амалдар ниетке байланысты",
  textKy: "Амалдар",
  textUz: "Амаллар",
  narratorKk: "",
  hadeethEncId: "66511",
  kyUzSourceLabel: "HadeethEnc.com",
  kyUzSourceAttribution: "رواه البخاري",
};

describe("hadithDisplay localization", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("uses locale collection labels without raw KK chrome", async () => {
    await setCurrentLocale("en");
    expect(hadithCollectionDisplayName(sample, "en")).toBe(kk.hadith.collectionBukhari);
    expect(hadithCollectionDisplayName(sample, "en")).not.toMatch(/ә|ғ|қ|ұ|ү|і|һ/i);

    await setCurrentLocale("ky");
    const src = hadithSourceForLocale(sample, "ky");
    expect(src.label).toMatch(/HadeethEnc/i);
    expect(src.citation).toContain("66511");
  });
});
