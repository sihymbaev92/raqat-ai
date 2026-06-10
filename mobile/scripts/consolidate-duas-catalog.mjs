/**
 * duasCatalog.ts: қайталанатын 100 топты, «Сүннет» және «Жаңа қосылған» бөлімдерін алып тастайды.
 * Іске қосу: node mobile/scripts/consolidate-duas-catalog.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, "..", "src", "content", "duasCatalog.ts");

let s = fs.readFileSync(catalogPath, "utf8");

const removeBlock = (startMarker, endMarker) => {
  const start = s.indexOf(startMarker);
  if (start < 0) {
    console.warn("skip, not found:", startMarker.slice(0, 40));
    return;
  }
  const end = s.indexOf(endMarker, start);
  if (end < 0) throw new Error("end not found for " + startMarker);
  s = s.slice(0, start) + s.slice(end);
  console.log("removed", startMarker.slice(0, 50));
};

removeBlock(
  '  {\n    title: "Сүннет пен күнделікті таңдаулы дұғалар",',
  '  {\n    title: "Жиі қайталанатын қысқа дұғалар (100)",'
);
removeBlock(
  '  {\n    title: "Жиі қайталанатын қысқа дұғалар (100)",',
  '  {\n    title: "Жаңа қосылған дұғалар",'
);
removeBlock('  {\n    title: "Жаңа қосылған дұғалар",', "\n];");

// Реттелген тақырыптар
const titleMap = [
  ['title: "Күнделікті және үй"', 'title: "I. Күнделікті және үй"'],
  ['title: "Дәрет дұғалары"', 'title: "II. Дәрет дұғалары"'],
  ['title: "Денсаулық пен рухани қиындық"', 'title: "III. Денсаулық және рухани қиындық"'],
  ['title: "Көлік, саяхат, базар"', 'title: "IV. Көлік, саяхат, базар"'],
  ['title: "Зікір және тәубе"', 'title: "V. Зікір, тәубе және салауат"'],
  ['title: "Қажылық, умра және Қағба дұғалары"', 'title: "VI. Қажылық, умра және Қағба"'],
  ['title: "Оқу, бата, қаржы"', 'title: "VII. Білім, емтихан және ризық"'],
];
for (const [from, to] of titleMap) {
  s = s.replace(from, to);
}

// Дәреттегі қайталанатын бисмилләһ — алып тастау
s = s.replace(
  /\n      \{\n        title: "Дәрет бастамас бұрын \(жиі\)",[\s\S]*?meaningKk:\n          "Дәретті Аллаһтың атымен бастаймын\. Басқа таза істерде де «бисмилләһ» айту — сүннет\.",\n      \},/,
  ""
);

// Медина дубликаты (бірдей араб)
s = s.replace(
  /\n      \{\n        title: "Медина — Пайғамбар ﷺ мешітіне кіргенде \(жалпы\)",[\s\S]*?meaningKk: "Аллаһ тағалам, маған мейірім есіктеріңді аш\.",\n      \},/,
  ""
);

if (!s.includes("DUA_SHORT_ZIKR_CATEGORY")) {
  const importLine =
    'import { DUA_SHORT_ZIKR_CATEGORY } from "./duasShortZikrCatalog";\nimport { orderDuaCategories } from "./duasMenzikir";\n\n';
  s = s.replace(
    "/** Сүреттеме:",
    importLine + "/** Сүреттеме:"
  );
  s = s.replace(
    "export const DUA_CATEGORIES: DuaCategory[] = [",
    "const DUA_CATEGORIES_RAW: DuaCategory[] = ["
  );
  s = s.replace(/\n\];(\s*)$/, "\n  DUA_SHORT_ZIKR_CATEGORY,\n];\n\nexport const DUA_CATEGORIES = orderDuaCategories(DUA_CATEGORIES_RAW);\n");
}

fs.writeFileSync(catalogPath, s);
console.log("done, length", s.length);
