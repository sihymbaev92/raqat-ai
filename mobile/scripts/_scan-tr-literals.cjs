const fs = require("fs");
const path = require("path");

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== "__tests__") walk(p, a);
    else if (/\.(tsx|ts)$/.test(e.name)) a.push(p);
  }
  return a;
}

const re = /tr\(\s*["']([^"']+)["']\s*\)/g;
const set = new Set();
const root = path.join(__dirname, "..", "src");
for (const f of walk(root)) {
  const t = fs.readFileSync(f, "utf8");
  let m;
  while ((m = re.exec(t))) {
    if (/[А-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(m[1])) set.add(m[1]);
  }
}
const out = [...set].sort();
fs.writeFileSync(path.join(__dirname, "_tr-literals.json"), JSON.stringify(out, null, 2));
console.log("count", out.length);
out.slice(0, 150).forEach((s) => console.log(s));
