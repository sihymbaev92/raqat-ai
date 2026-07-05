#!/usr/bin/env node
/** Static pages (privacy policy) → dist/ for Play Console + nginx. */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const srcDir = path.join(mobileRoot, "static-web");
const distDir = path.join(mobileRoot, "dist");

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("copy-web-static-pages: dist/index.html жоқ — алдымен export:web");
  process.exit(1);
}

function copyTree(rel) {
  const from = path.join(srcDir, rel);
  const to = path.join(distDir, rel);
  if (!fs.existsSync(from)) return 0;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.statSync(from).isDirectory()) {
    let n = 0;
    for (const name of fs.readdirSync(from)) {
      n += copyTree(path.join(rel, name));
    }
    return n;
  }
  fs.copyFileSync(from, to);
  return 1;
}

let copied = 0;
if (fs.existsSync(srcDir)) {
  for (const name of fs.readdirSync(srcDir)) {
    copied += copyTree(name);
  }
}
console.log(`copy-web-static-pages: ${copied} file(s) → dist/`);
