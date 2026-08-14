#!/usr/bin/env node
/** Patch missing PAGE_13 manual book strings into offline-auto-translations-core.json */
const fs = require("fs");
const path = require("path");

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const ENTRIES = [
  {
    kk: "Әріптің үстіне қойылатын сызықша. Жуан әріптің үстіне қойылса «а» мен «о» арасында, ал жіңішке әріптің үстіне қойылса «ә» дыбысын білдіреді.",
    ru: "Чертка над буквой. На «тяжёлые» буквы ставится звук между «а» и «о», на «лёгкие» — звук, близкий к «э».",
    en: "A stroke above the letter. On emphatic letters it sounds between “a” and “o”; on light letters it sounds like a short “e”.",
    ky: "Эрптин үстүнө коюлган сызык. Жоон эрптерде «а» менен «о» ортосунда, жеңил эрптерде «э»га жakin үн.",
    uz: "Harf ustidagi chiziq. Og'ir harflarda «a» va «o» orasidagi tovush, yengil harflarda «e»ga yaqin tovush.",
    tr: "Harfın üstündeki çizgi. Kalın harflerde «a» ile «o» arasında, ince harflerde «e»ye yakın bir ses.",
    ar: "خط فوق الحرف. على الأحرف المفخمة صوت بين «ا» و«و»، وعلى الأحرف الرقيقة صوت قريب من «e».",
  },
  {
    kk: "Әріптің астына қойылатын сызықша «и» дыбысын білдіреді.",
    ru: "Чертка под буквой обозначает звук «и».",
    en: "A stroke below the letter denotes the “i” sound.",
    ky: "Эрптин астына коюлган сызык «и» үнүн билдирет.",
    uz: "Harf ostidagi chiziq «i» tovushini bildiradi.",
    tr: "Harfın altındaki çizgi «i» sesini gösterir.",
    ar: "الخط تحت الحرف يدل على صوت «ي».",
  },
];

const corePath = path.join(__dirname, "..", "assets", "bundled", "offline-auto-translations-core.json");
const core = JSON.parse(fs.readFileSync(corePath, "utf8"));
if (!core.targets) core.targets = {};

for (const entry of ENTRIES) {
  const h = hash(entry.kk);
  for (const loc of ["ru", "en", "ky", "uz", "tr", "ar"]) {
    if (!core.targets[loc]) core.targets[loc] = {};
    core.targets[loc][h] = entry[loc];
  }
  console.log("patched", h, entry.kk.slice(0, 50));
}

fs.writeFileSync(corePath, `${JSON.stringify(core)}\n`, "utf8");
console.log("updated", corePath);
