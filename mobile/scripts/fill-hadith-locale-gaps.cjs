/**
 * Fill remaining curated gaps:
 * - textRu from HadeethEnc when hadeethEncId present
 * - textEn/textTr from fawaz by collection+reference
 * - textEn for enc-* rows from HadeethEnc language=en (if available)
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const SEED = path.join(ROOT, "assets/bundled/hadith-from-db-seed.json");
const BASES = [
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions",
  "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions",
];

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "RAQAT-fill-gaps/1" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        getJson(res.headers.location).then(resolve, reject);
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(45000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fawaz(prefix, book, num) {
  for (const base of BASES) {
    try {
      const data = await getJson(`${base}/${prefix}-${book}/${num}.min.json`);
      const t = data?.hadiths?.[0]?.text;
      if (typeof t === "string" && t.trim()) return t.trim();
    } catch {
      /* try next */
    }
  }
  return null;
}

async function enc(id, language) {
  const o = await getJson(`https://hadeethenc.com/api/v1/hadeeths/one/?id=${id}&language=${language}`);
  return String(o.hadeeth || "").trim();
}

async function main() {
  const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
  const hadiths = seed.hadiths || [];
  const stats = { ru: 0, en: 0, tr: 0, encEn: 0, miss: 0 };

  for (let i = 0; i < hadiths.length; i++) {
    const h = hadiths[i];
    const book = h.collection === "muslim" ? "muslim" : "bukhari";
    const num = parseInt(String(h.reference).replace(/\D+/g, ""), 10);
    const isEnc = h.catalogOrigin === "hadeethenc" || String(h.id).startsWith("enc-");

    if (!(h.textRu || "").trim() && h.hadeethEncId) {
      try {
        const ru = await enc(h.hadeethEncId, "ru");
        await sleep(40);
        if (ru) {
          h.textRu = ru;
          stats.ru++;
          console.log(h.id, "ru=enc");
        }
      } catch {
        stats.miss++;
      }
    }

    if (!isEnc && Number.isFinite(num) && num > 0) {
      if (!(h.textEn || "").trim()) {
        const en = await fawaz("eng", book, num);
        await sleep(60);
        if (en) {
          h.textEn = en;
          stats.en++;
          console.log(h.id, "en=fawaz");
        } else {
          stats.miss++;
          console.log(h.id, "en=MISS");
        }
      }
      if (!(h.textTr || "").trim()) {
        const tr = await fawaz("tur", book, num);
        await sleep(60);
        if (tr) {
          h.textTr = tr;
          stats.tr++;
          console.log(h.id, "tr=fawaz");
        } else {
          stats.miss++;
          console.log(h.id, "tr=MISS");
        }
      }
    }

    if (isEnc && h.hadeethEncId && !(h.textEn || "").trim()) {
      try {
        const en = await enc(h.hadeethEncId, "en");
        await sleep(40);
        if (en) {
          h.textEn = en;
          stats.encEn++;
          if (stats.encEn % 20 === 0) console.log("encEn", stats.encEn);
        }
      } catch {
        stats.miss++;
      }
    }
  }

  seed.version = Math.max(Number(seed.version || 0), 10);
  seed.provenance = {
    ...(seed.provenance || {}),
    recordedAt: new Date().toISOString(),
  };
  fs.writeFileSync(SEED, JSON.stringify(seed));
  console.log("wrote", SEED, stats, {
    en: hadiths.filter((h) => (h.textEn || "").trim()).length,
    ru: hadiths.filter((h) => (h.textRu || "").trim()).length,
    tr: hadiths.filter((h) => (h.textTr || "").trim()).length,
    ky: hadiths.filter((h) => (h.textKy || "").trim()).length,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
