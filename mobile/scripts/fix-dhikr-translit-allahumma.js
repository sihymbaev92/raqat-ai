#!/usr/bin/env node
/** Fix translitKk: «Аллаһ тағалам» → phonetic «Аллаһумма» (meaningKk unchanged). */
const fs = require("fs");
const path = require("path");

function fixTranslitKk(raw) {
  if (!raw || typeof raw !== "string") return raw;
  return raw.replace(/^Аллаһ тағалам,\s*/u, "Аллаһумма, ").replace(/^Аллаһ тағалам\s+/u, "Аллаһумма, ");
}

const jsonPath = path.join(__dirname, "../assets/bundled/dhikr-list.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
let changed = 0;
for (const item of data.items ?? []) {
  const next = fixTranslitKk(item.translitKk);
  if (next !== item.translitKk) {
    item.translitKk = next;
    changed += 1;
  }
}
fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`dhikr-list.json: fixed ${changed} translitKk entries`);
