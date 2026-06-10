/**
 * «Уа Аллаһ», «Аллаḥым» жүгінулерін «Аллаһ тағалам» формасына келтіру (қазақша UX).
 * dhikr-list.json / duasCatalog.ts үшін — build_dhikr_bundle қайта генерациясында қайта іске қосуға болады.
 */
const fs = require("fs");

function transform(s) {
  let out = s;
  out = out.split("Уа Аллаһым").join("Аллаһ тағалам");
  out = out.split("Уа Аллаһ").join("Аллаһ тағалам");
  out = out.split("Аллаһымрхамна").join("Аллаһ тағалам, рхамна");
  out = out.split("Аллаһымһдина").join("Аллаһ тағалам, һдина");
  out = out.split("Аллаһымғфир").join("Аллаһ тағалам, ғфир");
  out = out.split("Аллаһымфтaҳ").join("Аллаһ тағалам, фтәх");
  out = out.split("Аллаһым-ж'ални").join("Аллаһ тағалам, ж'ални");
  out = out.split("Аллаһым-стә'милна").join("Аллаһ тағалам, стә'милна");
  out = out.split("Аллаһым-ж'ал").join("Аллаһ тағалам, ж'ал");
  out = out.split("Бисмика, Аллаһым,").join("Бисмика, Аллаһ тағалам,");
  out = out.split(", Аллаһым,").join(", Аллаһ тағалам,");
  out = out.split("Аллаһым,").join("Аллаһ тағалам,");
  out = out.split("Аллаһым ").join("Аллаһ тағалам, ");
  out = out.split("Аллаһым").join("Аллаһ тағалам");
  while (out.includes("Аллаһ тағалам,,")) {
    out = out.split("Аллаһ тағалам,, ").join("Аллаһ тағалам, ");
    out = out.split("Аллаһ тағалам,,,").join("Аллаһ тағалам,");
    out = out.split("Аллаһ тағалам,,").join("Аллаһ тағалам,");
  }
  return out;
}

const pathMod = require("path");
const root = pathMod.join(__dirname, "..");
const repoRoot = pathMod.join(__dirname, "..", "..");
const files = [
  pathMod.join(root, "assets/bundled/dhikr-list.json"),
  pathMod.join(root, "assets/bundled/hadith-from-db.json"),
  pathMod.join(root, "src/content/duasCatalog.ts"),
  pathMod.join(root, "scripts/build_dhikr_bundle.py"),
  pathMod.join(root, "scripts/extend_dhikr_99.py"),
  pathMod.join(repoRoot, "db/migrations.py"),
  pathMod.join(repoRoot, "services/prayer_content.py"),
  pathMod.join(repoRoot, "scripts/add_bulk_dua_dhikr.py"),
];

for (const f of files) {
  const raw = fs.readFileSync(f, "utf8");
  const next = transform(raw);
  if (next !== raw) {
    fs.writeFileSync(f, next, "utf8");
    console.log("updated:", f);
  } else {
    console.log("unchanged:", f);
  }
}
