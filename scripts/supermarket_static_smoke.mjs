#!/usr/bin/env node
/** Static smoke checks for supermarket-site (no browser). */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "supermarket-site");
let failed = 0;

function ok(msg) {
  console.log(`OK ${msg}`);
}

function fail(msg) {
  console.error(`FAIL ${msg}`);
  failed += 1;
}

const html = readFileSync(join(site, "index.html"), "utf8");
const appJs = readFileSync(join(site, "app.js"), "utf8");
const configJs = readFileSync(join(site, "config.js"), "utf8");

if (html.includes("store-pro.css")) fail("index.html references store-pro.css");
else ok("no store-pro.css link");

if (!html.includes("config.js")) fail("index.html missing config.js");
else ok("config.js linked");

if (!html.includes('id="catalogSidebar"')) fail("missing catalog sidebar");
else ok("catalog sidebar present");

if (!html.includes('id="productGrid"')) fail("missing product grid");
else ok("product grid present");

if (!html.includes('id="catalogLoadSentinel"') && !appJs.includes("catalogLoadSentinel"))
  fail("infinite scroll sentinel missing from app flow");
else ok("infinite scroll wiring present");

if (!appJs.includes("selectCategory")) fail("selectCategory missing");
else ok("selectCategory present");

if (!appJs.includes("IntersectionObserver")) fail("IntersectionObserver missing");
else ok("infinite scroll observer present");

const pageMatch = configJs.match(/pageSize:\s*(\d+)/);
if (!pageMatch || Number(pageMatch[1]) !== 18) fail("config pageSize should be 18");
else ok("pageSize=18 in config");

for (const cat of ["milk", "bakery", "meat", "other"]) {
  const p = join(site, "assets", "fallback", `${cat}.svg`);
  if (!existsSync(p)) fail(`missing ${cat}.svg`);
}
ok("fallback SVG samples exist");

process.exit(failed ? 1 : 0);
