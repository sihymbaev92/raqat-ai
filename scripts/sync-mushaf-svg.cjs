#!/usr/bin/env node
/** SVG pages → mobile/assets/quran/svg */
const fs = require("fs");
const path = require("path");
const https = require("https");

const repoRoot = path.join(__dirname, "..");
const upstream = (
  process.env.EXPO_PUBLIC_MUSHAF_SVG_UPSTREAM_BASE ||
  "https://raw.githubusercontent.com/mushafdatabase/MushafDatabase-Ligature-Based-SVG/main/pages"
).replace(/\/+$/, "");
const dest = path.join(repoRoot, "mobile", "assets", "quran", "svg");

const from = parseInt(process.argv[2] || "1", 10);
const to = parseInt(process.argv[3] || "604", 10);
const CONCURRENCY = 8;

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function download(url, outPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(outPath)) {
      resolve("skip");
      return;
    }
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          download(res.headers.location, outPath).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          fs.writeFileSync(outPath, Buffer.concat(chunks));
          resolve("ok");
        });
      })
      .on("error", reject);
  });
}

async function pool(tasks, limit) {
  let i = 0;
  let n = 0;
  async function worker() {
    while (i < tasks.length) {
      const ix = i++;
      try {
        await tasks[ix]();
      } catch {
        /* skip failed */
      }
      n += 1;
      if (n % 25 === 0) process.stdout.write(`\r  ${n}/${tasks.length}`);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  console.log(`\r  ${tasks.length} pages processed`);
}

async function main() {
  ensureDir(dest);
  console.log(`== SVG ${from}..${to} ==`);
  const tasks = [];
  for (let p = from; p <= to; p += 1) {
    const n = String(p).padStart(3, "0");
    tasks.push(() => download(`${upstream}/${n}.svg`, path.join(dest, `${n}.svg`)));
  }
  await pool(tasks, CONCURRENCY);
  const count = fs.readdirSync(dest).filter((f) => f.endsWith(".svg")).length;
  console.log(`Done: ${dest} (${count} svg files)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
