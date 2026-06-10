import fs from "fs";
import path from "path";

const LATIN = /[A-Za-z]/;

function extractTranslitStrings(tsSource: string): string[] {
  const out: string[] = [];
  const re = /translit(?:eration)?Kk:\s*\n?\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tsSource))) {
    out.push(m[1]);
  }
  return out;
}

describe("Transliterations avoid Latin letters (Kazakh Cyrillic style)", () => {
  const duaFiles = ["duasCatalog.ts", "duasMergedExtras.ts", "duasShortZikrCatalog.ts"];

  it.each(duaFiles)("%s translitKk", (file) => {
    const p = path.join(__dirname, "..", file);
    const src = fs.readFileSync(p, "utf8");
    const bad = extractTranslitStrings(src).filter((s) => LATIN.test(s));
    expect(bad).toEqual([]);
  });

  it("namazLearningContent transliterationKk", () => {
    const p = path.join(__dirname, "../namazLearningContent.ts");
    const src = fs.readFileSync(p, "utf8");
    const bad = extractTranslitStrings(src).filter((s) => LATIN.test(s));
    expect(bad).toEqual([]);
  });
});
