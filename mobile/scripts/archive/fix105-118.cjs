const fs = require("fs");
const p = "src/content/duasCatalog.ts";
let s = fs.readFileSync(p, "utf8");
const before105 = s;
s = s.replace(
  "Аллаhумma, инни ә'uzу бikә, минәl-һubcис, уa л-һeбаc",
  "X"
);
// use exact from inner105.cjs
const old105 =
  "Аллаhумma, инни ә'uzу бikә, минәl-һubcис, уa л-һeбаc";
if (!s.includes(old105)) {
  const exact =
    "Аллаhумma, инни ә'uzу бikә, минәl-һubcис, уa л-һeбаc";
  const inner =
    "Аллаhумma, инни ә'uzу бikә, минәl-һubcис, уa л-һeбаc";
  const got = s.match(
    /title: "Туалетке кіру[\s\S]{0,200}translitKk: "([^"]+)"/
  )[1];
  console.log("expected (paste):", got);
  const neu105 =
    "Аллаhумma, инни ә'uzу бikә, минәl-һyбcис, уa л-һaбa'ис";
  s = s.replace(got, neu105);
} else {
  s = s.replace(old105, "NEU");
}
if (s === before105) {
  const got = s.match(
    /title: "Туалетке кіру[\s\S]{0,200}translitKk: "([^"]+)"/
  )[1];
  console.log("GOT", JSON.stringify(got));
  const neu105 =
    "Аллaһумma, инни ә'uzу бikә, минәl-һyбcис, уa л-һaбa'ис";
  s = s.replace(got, neu105);
}
const shaOld = s.match(
  /шахада\)[\s\S]*?translitKk:\s*[\r\n]*\s*"([^"]+(?:\n[^"]+)*)"/
);
if (shaOld) {
  // simpler: replace known bad shahada string
  const o =
    "Ашҳадu ан, лa иlхa иlлA АллAhу, wәxәdahu, лa шaрикa lаhу, уa ашhадu ан, нa, Mухamмeд, ңәbduhuhу, уa рaсuлhuhu";
  // read current
}
fs.writeFileSync(p, s);
console.log("done");
