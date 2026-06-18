#!/usr/bin/env node
/* Print the largest bundled mobile assets for release size review. */
const fs = require("fs");
const path = require("path");

function fmt(size) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function parseArgs(argv) {
  const args = { limit: 25, maxTotalMb: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--limit" && argv[i + 1]) {
      args.limit = Math.max(1, Number.parseInt(argv[i + 1], 10) || args.limit);
      i += 1;
    } else if (arg === "--max-total-mb" && argv[i + 1]) {
      const n = Number.parseFloat(argv[i + 1]);
      args.maxTotalMb = Number.isFinite(n) ? n : null;
      i += 1;
    }
  }
  return args;
}

function walkFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
    } else if (entry.isFile()) {
      out.push({ size: fs.statSync(full).size, file: full });
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(__dirname, "..");
  const assetRoot = path.join(root, "assets");
  const files = [];
  walkFiles(assetRoot, files);

  const total = files.reduce((sum, item) => sum + item.size, 0);
  console.log(`Mobile assets total: ${fmt(total)} (${files.length} files)`);
  console.log(`Top ${args.limit} assets:`);
  files
    .sort((a, b) => b.size - a.size || a.file.localeCompare(b.file))
    .slice(0, args.limit)
    .forEach((item) => {
      console.log(`- ${fmt(item.size)}  ${path.relative(root, item.file).replace(/\\/g, "/")}`);
    });

  if (args.maxTotalMb != null) {
    const budget = args.maxTotalMb * 1024 * 1024;
    if (total > budget) {
      console.log(`ERROR: Mobile assets exceed budget ${args.maxTotalMb.toFixed(2)} MB.`);
      process.exitCode = 1;
    }
  }
}

main();
