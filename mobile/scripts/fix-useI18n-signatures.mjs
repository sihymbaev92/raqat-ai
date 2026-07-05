import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "__tests__") continue;
      walk(p, acc);
    } else if (/\.tsx$/.test(name)) acc.push(p);
  }
  return acc;
}

function fixFile(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  if (!src.includes("useI18n();")) return false;

  const broken = /export function (\w+)\(\{\s*\n\s*useI18n\(\);\s*([^}]+)\}\s*:\s*([^)]+)\)\s*\{/;
  const m = src.match(broken);
  if (!m) return false;

  const [, fnName, restParams, typeName] = m;
  const replacement = `export function ${fnName}({ ${restParams.trim()} }: ${typeName}) {\n  useI18n();`;
  src = src.replace(broken, replacement);
  fs.writeFileSync(filePath, src, "utf8");
  console.log("fixed", path.relative(mobileRoot, filePath));
  return true;
}

let count = 0;
for (const f of walk(path.join(mobileRoot, "src"))) {
  if (fixFile(f)) count += 1;
}
console.log(`Fixed ${count} broken signatures.`);
