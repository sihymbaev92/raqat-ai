#!/usr/bin/env node
/**
 * Apply scholar sign-off to NAMAZ_CONTENT_REVIEW after imam/QMDB approval.
 *
 *   RAQAT_NAMAZ_REVIEWER_NAME="Аты Тегі" RAQAT_NAMAZ_REVIEWED_AT="2026-08-15" node scripts/apply-namaz-scholar-signoff.cjs
 */
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const targetPath = path.join(mobileRoot, "src", "content", "namazLearningContent.ts");

const reviewerName = (process.env.RAQAT_NAMAZ_REVIEWER_NAME || "").trim();
const reviewedAt = (process.env.RAQAT_NAMAZ_REVIEWED_AT || new Date().toISOString().slice(0, 10)).trim();

if (!reviewerName || reviewerName.length < 4) {
  console.error("RAQAT_NAMAZ_REVIEWER_NAME қажет (мин. 4 таңба): imam/QMDB reviewer full name");
  process.exit(1);
}

if (!/^\d{4}-\d{2}-\d{2}/.test(reviewedAt)) {
  console.error("RAQAT_NAMAZ_REVIEWED_AT ISO date керек (YYYY-MM-DD)");
  process.exit(1);
}

const reviewedAtIso = reviewedAt.includes("T") ? reviewedAt : `${reviewedAt}T12:00:00.000Z`;

let raw = fs.readFileSync(targetPath, "utf8");
if (raw.includes("approvedForPublicRelease: true")) {
  console.warn("Namaz content already marked approved — updating reviewer metadata only.");
}

raw = raw.replace(/approvedForPublicRelease:\s*false/, "approvedForPublicRelease: true");
raw = raw.replace(/reviewerName:\s*null/, `reviewerName: ${JSON.stringify(reviewerName)}`);
raw = raw.replace(/reviewedAtIso:\s*null/, `reviewedAtIso: ${JSON.stringify(reviewedAtIso)}`);

fs.writeFileSync(targetPath, raw, "utf8");
console.log(`Namaz scholar sign-off applied: ${reviewerName} @ ${reviewedAtIso.slice(0, 10)}`);
console.log(`updated ${targetPath}`);
