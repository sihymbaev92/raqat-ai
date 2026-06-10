#!/usr/bin/env node
/** Expo web dist — mushaf CDN assets (qcf4/svg/pages) nginx /assets/quran/ арқылы. */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const srcDir = path.join(mobileRoot, "assets", "quran");
const outDir = path.join(mobileRoot, "dist", "assets", "quran");

if (!fs.existsSync(path.join(mobileRoot, "dist", "index.html"))) {
  console.error("copy-web-quran-assets: dist/index.html жоқ");
  process.exit(1);
}

if (!fs.existsSync(srcDir)) {
  console.log("copy-web-quran-assets: skip (no assets/quran yet — run sync-mushaf-*.ps1)");
  process.exit(0);
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const name of fs.readdirSync(src)) {
    if (name === "README.txt") continue;
    const s = path.join(src, name);
    const d = path.join(dest, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) {
      count += copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
      count += 1;
    }
  }
  return count;
}

const n = copyRecursive(srcDir, outDir);
console.log(`copy-web-quran-assets: ${n} files → dist/assets/quran/`);
