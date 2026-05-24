import { kk } from "../../i18n/kk";
import { resolveHadithGradeText } from "../hadithGrade";

describe("resolveHadithGradeText", () => {
  it("көрсетілген дәрежені trim жасап қайтарады", () => {
    expect(resolveHadithGradeText("  сахих  ")).toBe("сахих");
  });

  it("дәрежесі бос болса 'көрсетілмеген' қайтарады", () => {
    expect(resolveHadithGradeText("")).toBe(kk.hadith.gradeUnknown);
  });
});
