/**
 * Enrich hadith-from-db-seed.json with trusted fawazahmed0 editions (en/ru/tr).
 * Match by collection + reference (hadith number). No machine translation.
 *
 * Source: https://github.com/fawazahmed0/hadith-api (MIT)
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

const LANGS = [
  { field: "textEn", prefix: "eng", attribution: "fawazahmed0/hadith-api eng-{book}" },
  { field: "textRu", prefix: "rus", attribution: "fawazahmed0/hadith-api rus-{book}" },
  { field: "textTr", prefix: "tur", attribution: "fawazahmed0/hadith-api tur-{book}" },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "RAQAT-enrich-hadith-seed/1" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} ${url}`));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
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
      reject(new Error(`timeout ${url}`));
    });
  });
}

async function fetchHadithText(prefix, book, num) {
  const edition = `${prefix}-${book}`;
  let lastErr = "fail";
  for (const base of BASES) {
    const url = `${base}/${edition}/${num}.min.json`;
    try {
      const data = await fetchJson(url);
      const t = data?.hadiths?.[0]?.text;
      if (typeof t === "string" && t.trim()) return t.trim();
      lastErr = "empty";
    } catch (e) {
      lastErr = String(e.message || e);
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
  const hadiths = seed.hadiths || [];
  const stats = { en: 0, ru: 0, tr: 0, miss: 0 };

  for (let i = 0; i < hadiths.length; i++) {
    const h = hadiths[i];
    const book = h.collection === "muslim" ? "muslim" : "bukhari";
    const num = parseInt(String(h.reference).replace(/\D+/g, ""), 10);
    if (!Number.isFinite(num) || num < 1) {
      stats.miss++;
      console.warn("bad ref", h.id, h.reference);
      continue;
    }
    process.stdout.write(`[${i + 1}/${hadiths.length}] ${h.id} #${num} `);
    for (const lang of LANGS) {
      if (h[lang.field] && String(h[lang.field]).trim()) {
        process.stdout.write(`${lang.field}=skip `);
        continue;
      }
      const text = await fetchHadithText(lang.prefix, book, num);
      await sleep(80);
      if (text) {
        h[lang.field] = text;
        if (lang.field === "textEn") stats.en++;
        if (lang.field === "textRu") stats.ru++;
        if (lang.field === "textTr") stats.tr++;
        process.stdout.write(`${lang.field}=ok `);
      } else {
        stats.miss++;
        process.stdout.write(`${lang.field}=MISS `);
      }
    }
    process.stdout.write("\n");
  }

  const hasKyUz = hadiths.some(
    (h) =>
      ((h.textKy || "").trim() || (h.textUz || "").trim()) &&
      String(h.kyUzSourceLabel || "").toLowerCase().includes("hadeethenc")
  );
  const prevEditions = (seed.provenance && seed.provenance.editions) || {};
  seed.version = Math.max(seed.version || 0, 10);
  seed.provenance = {
    ...(seed.provenance || {}),
    origin: "RAQAT · trusted multilingual hadith seed",
    evidenceKk: hasKyUz
      ? "Қазақша: қолданба ішіндегі сенімді каталог. Араб: түпнұсқа. en/ru/tr: fawazahmed0/hadith-api (MIT). ky/uz: HadeethEnc.com."
      : "Қазақша: қолданба ішіндегі сенімді каталог. Араб: түпнұсқа. en/ru/tr: fawazahmed0/hadith-api (MIT). ky/uz: сенімді ашық цифрлық басылым әзірге жоқ — тізім бос.",
    recordedAt: new Date().toISOString(),
    licenseHint:
      "ar=original; kk=in-app QMDB-cited catalog; en/ru/tr=fawazahmed0/hadith-api; ky/uz=HadeethEnc when present; no machine translation of hadith body.",
    editions: {
      en: "eng-bukhari / eng-muslim (fawazahmed0)",
      ru: "rus-bukhari / rus-muslim (fawazahmed0)",
      tr: "tur-bukhari / tur-muslim (fawazahmed0)",
      ar: "ara text in seed",
      kk: "kz-trusted catalog",
      ky: hasKyUz
        ? prevEditions.ky && /hadeethenc/i.test(String(prevEditions.ky))
          ? prevEditions.ky
          : "HadeethEnc.com (matched rows)"
        : "pending licensed edition",
      uz: hasKyUz
        ? prevEditions.uz && /hadeethenc/i.test(String(prevEditions.uz))
          ? prevEditions.uz
          : "HadeethEnc.com (matched rows)"
        : "pending licensed edition",
    },
  };

  fs.writeFileSync(SEED, JSON.stringify(seed));
  console.log("wrote", SEED);
  console.log("stats", stats);
  console.log(
    "coverage",
    {
      n: hadiths.length,
      withEn: hadiths.filter((h) => (h.textEn || "").trim()).length,
      withRu: hadiths.filter((h) => (h.textRu || "").trim()).length,
      withTr: hadiths.filter((h) => (h.textTr || "").trim()).length,
      withKk: hadiths.filter((h) => (h.textKk || "").trim()).length,
      withAr: hadiths.filter((h) => (h.arabic || "").trim()).length,
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
