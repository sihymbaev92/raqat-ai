const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "src");
const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      walk(p, a);
    } else if (exts.has(path.extname(e.name))) {
      a.push(p);
    }
  }
  return a;
}

const files = walk(src);
const corpusParts = [];
if (fs.existsSync(path.join(root, "App.tsx"))) {
  corpusParts.push(fs.readFileSync(path.join(root, "App.tsx"), "utf8"));
}
for (const f of files) {
  corpusParts.push(fs.readFileSync(f, "utf8"));
}
const corpus = corpusParts.join("\n");

function basenameNoExt(f) {
  return path.basename(f).replace(/\.(tsx?|jsx?)$/, "");
}

function relImportPatterns(f) {
  const rel = path.relative(src, f).replace(/\\/g, "/").replace(/\.(tsx?|jsx?)$/, "");
  const parts = rel.split("/");
  const patterns = new Set();
  patterns.add(rel);
  patterns.add("./" + rel);
  patterns.add("../" + rel);
  for (let i = 0; i < parts.length; i++) {
    const tail = parts.slice(i).join("/");
    patterns.add(tail);
    patterns.add("./" + tail);
    patterns.add("../" + tail);
  }
  patterns.add(basenameNoExt(f));
  return [...patterns];
}

function isReferenced(f) {
  const base = basenameNoExt(f);
  const pats = relImportPatterns(f);
  for (const p of pats) {
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const fromRe = new RegExp(`from\\s+['"][^'"]*${esc}['"]`);
    const reqRe = new RegExp(`require\\(['"][^'"]*${esc}['"]\\)`);
    if (fromRe.test(corpus) || reqRe.test(corpus)) return true;
  }
  const dynRe = new RegExp(`import\\(['"][^'"]*${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  return dynRe.test(corpus);
}

const skip = (f) =>
  f.includes("__tests__") ||
  f.includes("navigation/types.ts") ||
  f.endsWith(".d.ts") ||
  f.includes(".web.ts") ||
  f.includes(".web.tsx") ||
  f.includes(".native.ts") ||
  f.includes(".generated.");

const orphans = [];
for (const f of files) {
  if (skip(f)) continue;
  if (!isReferenced(f)) {
    orphans.push(path.relative(root, f).replace(/\\/g, "/"));
  }
}

orphans.sort();
console.log("ORPHAN_COUNT", orphans.length);
for (const o of orphans) console.log(o);
