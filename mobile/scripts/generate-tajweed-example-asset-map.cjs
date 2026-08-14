#!/usr/bin/env node
/** Metro static require map for assets/tajweed/examples/*.mp3 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const examplesDir = path.join(mobileRoot, "assets", "tajweed", "examples");
const outFile = path.join(mobileRoot, "src", "content", "tajweedExampleAssetMap.generated.ts");

if (!fs.existsSync(examplesDir)) {
  console.warn("generate-tajweed-example-asset-map: examples dir missing — stub map");
  fs.writeFileSync(
    outFile,
    `/** Auto-generated — no example mp3 on disk. Regen: node scripts/generate-tajweed-example-asset-map.cjs */\nexport const TAJWEED_EXAMPLE_ASSET_BY_FILE: Record<string, number> = {};\n`
  );
  process.exit(0);
}

const files = fs
  .readdirSync(examplesDir)
  .filter((f) => f.endsWith(".mp3"))
  .sort();

const lines = files.map((f) => `  "${f}": require("../../assets/tajweed/examples/${f}"),`);

const body = `/** Auto-generated — do not edit. Regen: node scripts/generate-tajweed-example-asset-map.cjs */
export const TAJWEED_EXAMPLE_ASSET_BY_FILE: Record<string, number> = {
${lines.join("\n")}
};
`;

fs.writeFileSync(outFile, body);
console.log(`generate-tajweed-example-asset-map: ${files.length} files → ${path.relative(mobileRoot, outFile)}`);
