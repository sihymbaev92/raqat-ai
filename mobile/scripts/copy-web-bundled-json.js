#!/usr/bin/env node
/** Expo web dist — JSON бандлдан тыс, nginx /assets/bundled/ арқылы. */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const srcDir = path.join(mobileRoot, "assets", "bundled");
const outDir = path.join(mobileRoot, "dist", "assets", "bundled");

if (!fs.existsSync(path.join(mobileRoot, "dist", "index.html"))) {
  console.error("copy-web-bundled-json: dist/index.html жоқ");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const skipFiles = new Set([
  "offline-auto-translations.json",
  // Web startup/list uses hadith-from-db-seed.json; the full corpus is too large
  // for the static web release payload and should be published through a separate CDN path if needed.
  "hadith-from-db.json",
]);
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".json") && !skipFiles.has(f));
for (const f of files) {
  fs.copyFileSync(path.join(srcDir, f), path.join(outDir, f));
}
console.log(`copy-web-bundled-json: ${files.length} JSON → dist/assets/bundled/`);
