import { setCurrentLocale } from "../../i18n/runtime";
import { kk } from "../../i18n/kk";
import { resolveHadithGradeText } from "../hadithGrade";

describe("hadithGrade localization", () => {
  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it("maps sahih markers to locale gradeSahih label", async () => {
    expect(resolveHadithGradeText("сахих")).toBe(kk.hadith.gradeSahih);
    expect(resolveHadithGradeText("صحيح")).toBe(kk.hadith.gradeSahih);
    expect(resolveHadithGradeText("")).toBe(kk.hadith.gradeUnknown);

    await setCurrentLocale("en");
    expect(resolveHadithGradeText("صحيح")).toBe(kk.hadith.gradeSahih);
    expect(kk.hadith.gradeSahih).toMatch(/sahih/i);
  });

  it("does not surface Kazakh-letter grades under ru", async () => {
    await setCurrentLocale("ru");
    const out = resolveHadithGradeText("хасан");
    expect(out).not.toMatch(/[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/);
  });
});
