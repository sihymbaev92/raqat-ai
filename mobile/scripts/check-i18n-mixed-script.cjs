const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/i18n/runtime.ts",
  "src/i18n/kk.ts",
  "src/i18n/azanLocalePatches.ts",
  "src/content/namazContent.ts",
  "src/content/namazPrayerGuideContent.ts",
  "src/content/namazLearningContent.ts",
].map((f) => path.join(ROOT, f));

const MIXED =
  /[\u0400-\u04FF]+[a-z][\u0400-\u04FF]|[\u0400-\u04FF][a-z]+[\u0400-\u04FF]/;

const ALLOW = /^(Halal|bookmark|Exact|locked-phone|Azan|QA|Full-screen|Locked-screen|Siri|Muftyat|Fatua|api\.|channel|Android|PostgreSQL|SQLite|HTTP|HTTPS|VPN|Wi|ngrok|Cloudflare|localtunnel|VPS|USB|APK|ETag|OAuth|Sunnah|WhatsApp|RAHAT|OMIR|AI|JSON|npm|adb|FSI)$/i;

let violations = 0;
for (const file of FILES) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const quotes = line.match(/"([^"\\]|\\.)*"/g) || [];
    for (const q of quotes) {
      const s = q.slice(1, -1);
      if (!/[\u0400-\u04FF]/.test(s)) continue;
      for (const word of s.split(/\s+/)) {
        const bare = word.replace(/[«».,:;!?()—\-]/g, "");
        if (!MIXED.test(bare)) continue;
        if (ALLOW.test(bare)) continue;
        console.log(`${path.relative(ROOT, file)}:${i + 1} ${bare}`);
        violations++;
      }
    }
  }
}
process.exit(violations ? 1 : 0);
