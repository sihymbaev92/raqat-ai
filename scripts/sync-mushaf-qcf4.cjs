#!/usr/bin/env node
/**
 * QCF4 Madinah Mushaf → mobile/assets/quran/qcf4
 * Usage: node scripts/sync-mushaf-qcf4.mjs [--pages-only] [--fonts-only]
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const repoRoot = path.join(__dirname, "..");
const upstream = (
  process.env.EXPO_PUBLIC_QCF4_UPSTREAM_BASE ||
  "https://raw.githubusercontent.com/MohamadHajjRabee/quran-qcf4/main"
).replace(/\/+$/, "");
const dest = path.join(repoRoot, "mobile", "assets", "quran", "qcf4");

const pagesOnly = process.argv.includes("--pages-only");
const fontsOnly = process.argv.includes("--fonts-only");
const CONCURRENCY = 10;

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function download(url, outPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(outPath)) {
      resolve("skip");
      return;
    }
    ensureDir(path.dirname(outPath));
    const mod = url.startsWith("https") ? https : http;
    mod
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          download(res.headers.location, outPath).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} ${url}`));
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
  let ok = 0;
  let skip = 0;
  let fail = 0;
  async function worker() {
    while (i < tasks.length) {
      const ix = i++;
      const t = tasks[ix];
      try {
        const r = await t();
        if (r === "skip") skip += 1;
        else ok += 1;
      } catch (e) {
        fail += 1;
        console.warn(String(e.message || e));
      }
      if ((ok + skip + fail) % 50 === 0) {
        process.stdout.write(`\r  ${ok + skip + fail}/${tasks.length} (ok=${ok} skip=${skip} fail=${fail})`);
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  console.log(`\r  done: ok=${ok} skip=${skip} fail=${fail}`);
  return fail;
}

async function main() {
  ensureDir(path.join(dest, "pages"));
  ensureDir(path.join(dest, "fonts"));
  ensureDir(path.join(dest, "fonts-woff2"));

  if (!fontsOnly) {
    console.log("== QCF4 pages (604 JSON) ==");
    const pageTasks = [];
    for (let p = 1; p <= 604; p += 1) {
      const n = String(p).padStart(3, "0");
      pageTasks.push(() => download(`${upstream}/pages/${n}.json`, path.join(dest, "pages", `${n}.json`)));
    }
    const pageFails = await pool(pageTasks, CONCURRENCY);
    for (const meta of ["font-map.json", "index.json", "verses.json"]) {
      await download(`${upstream}/${meta}`, path.join(dest, meta));
    }
    if (pageFails > 0) process.exitCode = 1;
  }

  if (!pagesOnly) {
    console.log("== QCF4 fonts (47 + BSML) ==");
    const fontTasks = [];
    for (let f = 1; f <= 47; f += 1) {
      const id = `QCF4_Hafs_${String(f).padStart(2, "0")}`;
      fontTasks.push(() =>
        download(`${upstream}/fonts/${id}_W.ttf`, path.join(dest, "fonts", `${id}_W.ttf`))
      );
      fontTasks.push(() =>
        download(
          `${upstream}/fonts-woff2/${id}_W.woff2`,
          path.join(dest, "fonts-woff2", `${id}_W.woff2`)
        )
      );
    }
    fontTasks.push(() =>
      download(`${upstream}/fonts/QCF4_QBSML.ttf`, path.join(dest, "fonts", "QCF4_QBSML.ttf"))
    );
    fontTasks.push(() =>
      download(
        `${upstream}/fonts-woff2/QCF4_QBSML.woff2`,
        path.join(dest, "fonts-woff2", "QCF4_QBSML.woff2")
      )
    );
    await pool(fontTasks, 6);
  }

  console.log(`Done: ${dest}`);
  console.log("Next: node scripts/generate-ayah-map-from-qcf4.cjs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
