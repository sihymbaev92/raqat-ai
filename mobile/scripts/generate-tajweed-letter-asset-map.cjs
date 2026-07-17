#!/usr/bin/env node
/** Metro static require map for assets/tajweed/letters/*.mp3 (slim APK bundle ~0.5 MB). */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const lettersDir = path.join(mobileRoot, "assets", "tajweed", "letters");
const outFile = path.join(mobileRoot, "src", "content", "tajweedLetterAssetMap.generated.ts");

if (!fs.existsSync(lettersDir)) {
  console.warn("generate-tajweed-letter-asset-map: letters dir missing — stub map");
  fs.writeFileSync(
    outFile,
    `/** Auto-generated — no letter mp3 on disk. Regen: node scripts/generate-tajweed-letter-asset-map.cjs */\nexport const TAJWEED_LETTER_ASSET_BY_FILE: Record<string, number> = {};\n`
  );
  process.exit(0);
}

const files = fs
  .readdirSync(lettersDir)
  .filter((f) => f.endsWith(".mp3"))
  .sort();

const lines = files.map((f) => `  "${f}": require("../../assets/tajweed/letters/${f}"),`);

const body = `/** Auto-generated — do not edit. Regen: node scripts/generate-tajweed-letter-asset-map.cjs */
export const TAJWEED_LETTER_ASSET_BY_FILE: Record<string, number> = {
${lines.join("\n")}
};
`;

fs.writeFileSync(outFile, body);
console.log(`generate-tajweed-letter-asset-map: ${files.length} files → ${path.relative(mobileRoot, outFile)}`);
