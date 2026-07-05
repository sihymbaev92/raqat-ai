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

function patchFile(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  if (
    !src.includes('from "../i18n/kk"') &&
    !src.includes('from "../../i18n/kk"') &&
    !src.includes('from "../../../i18n/kk"')
  ) {
    return false;
  }
  if (/useAppLocale|useI18n|useLocalizedText/.test(src)) return false;

  if (src.includes('from "../i18n/kk"') && !src.includes("useI18n")) {
    src = src.replace(
      'from "../i18n/kk";',
      'from "../i18n/kk";\nimport { useI18n } from "../i18n/useI18n";'
    );
  } else if (src.includes('from "../../i18n/kk"') && !src.includes("useI18n")) {
    src = src.replace(
      'from "../../i18n/kk";',
      'from "../../i18n/kk";\nimport { useI18n } from "../../i18n/useI18n";'
    );
  } else if (src.includes('from "../../../i18n/kk"') && !src.includes("useI18n")) {
    src = src.replace(
      'from "../../../i18n/kk";',
      'from "../../../i18n/kk";\nimport { useI18n } from "../../../i18n/useI18n";'
    );
  } else {
    return false;
  }

  const fnMatch = src.match(/export function (\w+)\([^)]*\)\s*\{/);
  if (!fnMatch) return false;
  const fnName = fnMatch[1];
  const needle = `export function ${fnName}(`;
  const fnIdx = src.indexOf(needle);
  const braceIdx = src.indexOf("{", fnIdx);
  if (braceIdx < 0) return false;
  const afterBrace = src.slice(braceIdx + 1, braceIdx + 80);
  if (afterBrace.includes("useI18n()")) return false;

  src = `${src.slice(0, braceIdx + 1)}\n  useI18n();${src.slice(braceIdx + 1)}`;
  fs.writeFileSync(filePath, src, "utf8");
  console.log("patched", path.relative(mobileRoot, filePath));
  return true;
}

let count = 0;
for (const f of walk(path.join(mobileRoot, "src"))) {
  if (patchFile(f)) count += 1;
}
console.log(`Done. Patched ${count} files.`);
