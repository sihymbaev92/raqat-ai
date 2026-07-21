import { kk } from "../kk";
import { setCurrentLocale } from "../runtime";
import { collectKkStringLeaves } from "../localeLeakScan";

const KK = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;

describe("full RU chrome dump", () => {
  it("prints every remaining KK-letter string", async () => {
    await setCurrentLocale("ru");
    const all = collectKkStringLeaves(kk).filter((l) => KK.test(l.value));
    // eslint-disable-next-line no-console
    console.log("TOTAL_KK_LETTER_STRINGS=" + all.length);
    all.forEach((l) => console.log(l.path + "\t" + JSON.stringify(l.value).slice(0, 120)));
    const unexpected = all.filter(
      (l) =>
        !l.path.includes("languageKk") &&
        l.value.trim() !== "ҚМДБ" &&
        l.value !== "…"
    );
    expect(unexpected).toEqual([]);
  });
});
