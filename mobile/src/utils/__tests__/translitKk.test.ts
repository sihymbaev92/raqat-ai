import { normalizeAllahummaTranslit, pickBestTranslit, isRedundantTranslitTitle } from "../translitKk";

describe("normalizeAllahummaTranslit", () => {
  it("replaces Kazakh address with phonetic Аллаһумма at start", () => {
    expect(normalizeAllahummaTranslit("Аллаһ тағалам, инни ә'узу бикә")).toBe(
      "Аллаһумма, инни ә'узу бикә",
    );
  });

  it("leaves correct translit unchanged", () => {
    expect(normalizeAllahummaTranslit("Аллаһумма, инни ас'алука")).toBe("Аллаһумма, инни ас'алука");
  });
});

describe("pickBestTranslit", () => {
  it("keeps bundled post-salah translit with middle dots", () => {
    const ar = "سُبْحَانَ اللَّهِ · الْحَمْدُ لِلَّهِ · اللَّهُ أَكْبَرُ";
    expect(pickBestTranslit(ar, "Субхана Аллаһ · Әлхамду Лиллаһ · Аллаһу Акбар")).toBe(
      "Субхана Аллаһ · Әлхамду Лиллаһ · Аллаһу Акбар",
    );
  });

  it("normalizes legacy Аллаһ тағалам in stored translit", () => {
    const ar = "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ مَا خَلَقْتَ";
    expect(pickBestTranslit(ar, "Аллаһ тағалам, инни ә'узу бикә мин шәрри мә халақа")).toBe(
      "Аллаһумма, инни ә'узу бикә мин шәрри мә халақа",
    );
  });
});

describe("isRedundantTranslitTitle", () => {
  it("detects exact duplicate title/translit", () => {
    expect(
      isRedundantTranslitTitle(
        "СубханаЛлаһи уә бихамдиһи",
        "СубханаЛлаһи уә бихамдиһи",
      ),
    ).toBe(true);
  });

  it("keeps Kazakh label when different from translit", () => {
    expect(
      isRedundantTranslitTitle(
        "Намаздан кейінгі тәспих",
        "Субхана Аллаһ · Әлхамду Лиллаһ · Аллаһу Акбар",
      ),
    ).toBe(false);
  });

  it("hides partial translit title when full translit exists", () => {
    expect(
      isRedundantTranslitTitle(
        "Ла илаһа иллаллаһу уахдаһу",
        "Ла илаһа иллаллаһу уахдаһу ла шарика ләһу",
      ),
    ).toBe(true);
  });
});
