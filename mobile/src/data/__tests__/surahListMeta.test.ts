import {
  mushafStartPageForSurah,
  surahListMetaSubtitle,
  surahListNumberedTitle,
  juzAtSurahStart,
} from "../surahListMeta";
import { SURAH_TITLES_KK, surahDisplayTitle } from "../../constants/surahTitleKk";

describe("surahListMeta", () => {
  it("formats numbered kk title", () => {
    expect(surahListNumberedTitle(1, "")).toBe("1. Әл-Фатиха");
    expect(surahListNumberedTitle(4, "")).toBe("4. Ән-Ниса");
  });

  it("uses natural Kazakh surah title spellings", () => {
    expect(SURAH_TITLES_KK).toHaveLength(114);
    expect(surahDisplayTitle(10, "Yunus")).toBe("Юнус");
    expect(surahDisplayTitle(12, "Yusuf")).toBe("Юсуф");
    expect(surahDisplayTitle(20, "Taha")).toBe("Таһа");
    expect(surahDisplayTitle(29, "Al-Ankabut")).toBe("Әл-Анкабут");
    expect(surahDisplayTitle(36, "Ya-Sin")).toBe("Ясин");
    expect(surahDisplayTitle(50, "Qaf")).toBe("Қаф");
    expect(surahDisplayTitle(72, "Al-Jinn")).toBe("Әл-Жын");
    expect(surahDisplayTitle(112, "Al-Ikhlas")).toBe("Әл-Ықылас");
    expect(surahDisplayTitle(114, "An-Nas")).toBe("Ән-Нас");
  });

  it("keeps obvious non-Kazakh mixed spellings out of the bundled titles", () => {
    expect(SURAH_TITLES_KK.join("|")).not.toMatch(/Йү|Қә|Дж|Мәі|Мудж/u);
  });

  it("maps mushaf start pages (Hafs 604)", () => {
    expect(mushafStartPageForSurah(1)).toBe(1);
    expect(mushafStartPageForSurah(2)).toBe(2);
    expect(mushafStartPageForSurah(4)).toBe(77);
  });

  it("builds meta subtitle with revelation place", () => {
    expect(surahListMetaSubtitle(1, 7)).toContain("Мекке");
    expect(surahListMetaSubtitle(1, 7)).toContain("7 аят");
    expect(surahListMetaSubtitle(2, 286)).toContain("Мәдина");
  });

  it("resolves juz at surah start", () => {
    expect(juzAtSurahStart(1)).toBe(1);
    expect(juzAtSurahStart(4)).toBe(4);
  });
});
