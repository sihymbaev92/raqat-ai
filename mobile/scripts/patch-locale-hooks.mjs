import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "__tests__") continue;
      walk(p, out);
      continue;
    }
    if (!/\.tsx$/.test(ent.name)) continue;
    if (ent.name.endsWith(".test.tsx")) continue;
    const rel = path.relative(ROOT, p).replace(/\\/g, "/");
    if (!/^(screens|components|navigation)\//.test(rel)) continue;
    const c = fs.readFileSync(p, "utf8");
    if (!c.includes("i18n/kk")) continue;
    if (c.includes("useAppLocale()") || c.includes("useI18n(")) continue;
    out.push(p);
  }
  return out;
}

function importPathFor(file) {
  const depth = path.relative(ROOT, file).split(path.sep).length - 1;
  return `${"../".repeat(depth)}i18n/runtime`;
}

function addImport(c, importPath) {
  if (c.includes(`from "${importPath}"`)) return c;
  const lines = c.split("\n");
  let insertAt = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) insertAt = i;
    else if (insertAt >= 0 && lines[i].trim() !== "" && !/^import\s/.test(lines[i])) break;
  }
  if (insertAt < 0) return null;
  lines.splice(insertAt + 1, 0, `import { useAppLocale } from "${importPath}";`);
  return lines.join("\n");
}

function insertHook(c) {
  const re = /export function (\w+)\s*\([\s\S]*?\)\s*\{/;
  const fn = c.match(re);
  if (!fn) return null;
  const insertAt = fn.index + fn[0].length;
  return `${c.slice(0, insertAt)}\n  useAppLocale();${c.slice(insertAt)}`;
}

const targets = walk(ROOT);
let patched = 0;
const failed = [];

for (const p of targets) {
  let c = fs.readFileSync(p, "utf8");
  const withImport = addImport(c, importPathFor(p));
  if (!withImport) {
    failed.push(path.relative(ROOT, p));
    continue;
  }
  const withHook = insertHook(withImport);
  if (!withHook) {
    failed.push(path.relative(ROOT, p));
    continue;
  }
  fs.writeFileSync(p, withHook, "utf8");
  patched++;
}

console.log(JSON.stringify({ patched, failedCount: failed.length, failed }, null, 2));
