#!/usr/bin/env node
/**
 * Release APK-дан remote JSON pack-терді уақытша staging-ке көшіреді (APK көлемін азайту).
 * Usage: node scripts/strip-apk-remote-assets.cjs strip|restore
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const bundledDir = path.join(mobileRoot, "assets", "bundled");
const stagingDir = path.join(mobileRoot, ".content-pack-staging", "bundled");
const manifestPath = path.join(mobileRoot, ".content-pack-staging", "manifest.json");

const REMOTE_JSON = [
  "offline-auto-translations-core.json",
  "great-words-catalog.json",
  "halal-companies-snapshot.json",
];

const action = process.argv[2] || "strip";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function strip() {
  ensureDir(stagingDir);
  const moved = [];
  for (const name of REMOTE_JSON) {
    const src = path.join(bundledDir, name);
    const dst = path.join(stagingDir, name);
    if (!fs.existsSync(src)) continue;
    fs.renameSync(src, dst);
    moved.push(name);
  }
  fs.writeFileSync(manifestPath, JSON.stringify({ moved, at: new Date().toISOString() }, null, 2));
  console.log(`strip-apk-remote-assets: moved ${moved.length} files → .content-pack-staging/bundled/`);
}

function restore() {
  if (!fs.existsSync(manifestPath)) {
    console.log("strip-apk-remote-assets: nothing to restore");
    return;
  }
  ensureDir(bundledDir);
  let restored = 0;
  for (const name of REMOTE_JSON) {
    const src = path.join(stagingDir, name);
    const dst = path.join(bundledDir, name);
    if (!fs.existsSync(src)) continue;
    if (fs.existsSync(dst)) {
      fs.unlinkSync(dst);
    }
    fs.renameSync(src, dst);
    restored += 1;
  }
  try {
    fs.unlinkSync(manifestPath);
  } catch {
    /* ignore */
  }
  console.log(`strip-apk-remote-assets: restored ${restored} files`);
}

if (action === "strip") strip();
else if (action === "restore") restore();
else {
  console.error("Usage: node scripts/strip-apk-remote-assets.cjs strip|restore");
  process.exit(1);
}
