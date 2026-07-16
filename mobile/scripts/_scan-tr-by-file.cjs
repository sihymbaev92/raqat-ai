/**
 * Map Cyrillic tr("…") UI chrome → kk.* keys + expand critical patches.
 * Run: node scripts/fix-tr-chrome-i18n.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== "__tests__") walk(p, a);
    else if (/\.(tsx|ts)$/.test(e.name)) a.push(p);
  }
  return a;
}

// File → [{literal, line}]
const byFile = {};
const re = /tr\(\s*(["'])([^"']+)\1\s*\)/g;
for (const f of walk(path.join(root, "src"))) {
  const t = fs.readFileSync(f, "utf8");
  let m;
  const hits = [];
  while ((m = re.exec(t))) {
    if (/[А-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(m[2])) {
      hits.push({ lit: m[2], idx: m.index });
    }
  }
  if (hits.length) byFile[path.relative(root, f).replace(/\\/g, "/")] = hits;
}
fs.writeFileSync(path.join(__dirname, "_tr-by-file.json"), JSON.stringify(byFile, null, 2));
console.log("files", Object.keys(byFile).length);
for (const [f, hits] of Object.entries(byFile)) {
  console.log(f, hits.length);
}
