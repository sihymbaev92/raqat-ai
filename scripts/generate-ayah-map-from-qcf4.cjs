#!/usr/bin/env node
/**
 * QCF4 page JSON → ayah_map.json (normalized hotspots per page).
 * Usage: node scripts/generate-ayah-map-from-qcf4.mjs [pagesDir] [outFile]
 */
const fs = require("fs");
const path = require("path");

const pagesDir = path.resolve(process.argv[2] || "mobile/assets/quran/qcf4/pages");
const outFile = path.resolve(process.argv[3] || "mobile/assets/quran/ayah_map.json");

const LINES = 15;

function parseVerseKey(vk) {
  const m = /^(\d+):(\d+)$/.exec(String(vk || "").trim());
  if (!m) return null;
  return { surah: parseInt(m[1], 10), ayah: parseInt(m[2], 10) };
}

function buildPageHotspots(pageJson) {
  const ayahLines = new Map();
  for (const line of pageJson.lines || []) {
    for (const w of line.words || []) {
      if (!w.verse_key || w.type === "end" || w.type === "surah_header") continue;
      const ref = parseVerseKey(w.verse_key);
      if (!ref) continue;
      const key = `${ref.surah}:${ref.ayah}`;
      const set = ayahLines.get(key) || new Set();
      set.add(line.line);
      ayahLines.set(key, set);
    }
  }
  const hotspots = [];
  for (const [key, lines] of ayahLines) {
    const [s, a] = key.split(":").map((x) => parseInt(x, 10));
    const minL = Math.min(...lines);
    const maxL = Math.max(...lines);
    const y = (minL - 1) / LINES;
    const h = (maxL - minL + 1) / LINES;
    hotspots.push({ surah: s, ayah: a, x: 0.04, y, w: 0.92, h });
  }
  hotspots.sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);
  return hotspots;
}

if (!fs.existsSync(pagesDir)) {
  console.error(`pagesDir missing: ${pagesDir}`);
  process.exit(1);
}

const pages = {};
const files = fs.readdirSync(pagesDir).filter((f) => /^\d{3}\.json$/.test(f));
for (const f of files) {
  const n = parseInt(f.slice(0, 3), 10);
  const raw = JSON.parse(fs.readFileSync(path.join(pagesDir, f), "utf8"));
  pages[String(n)] = buildPageHotspots(raw);
}

const out = { version: 1, edition: "hafs-604", source: "qcf4", pages };
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log(`ayah_map: ${files.length} pages → ${outFile}`);
