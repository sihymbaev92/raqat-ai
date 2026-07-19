/**
 * Enrich hadith seed with Kyrgyz + Uzbek (+ RU fallback) from HadeethEnc.com.
 * Match by Arabic matn similarity — no machine translation.
 *
 * Flags:
 *   --force-index   rebuild AR index cache
 *   --expand        append Enc bukhari/muslim rows not already in seed (ky+uz)
 *   --fill-ru       fill missing textRu from HadeethEnc (fixes empty fawaz rus-muslim)
 *
 * Terms (HadeethEnc): do not alter content; attribute HadeethEnc.com.
 * API: https://hadeethenc.com/api/v1/
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const SEED = path.join(ROOT, "assets/bundled/hadith-from-db-seed.json");
const CACHE = path.join(ROOT, ".tmp-hadeethenc-ar-index.json");

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "RAQAT-enrich-hadith-ky-uz/2" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        getJson(res.headers.location).then(resolve, reject);
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error(`timeout ${url}`));
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normAr(s) {
  return String(s || "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[^\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return normAr(s)
    .split(" ")
    .filter((w) => w.length >= 3);
}

function jaccard(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Seed tokens covered by Enc (seed often shorter matn). */
function containment(seed, enc) {
  const A = new Set(tokens(seed));
  const B = new Set(tokens(enc));
  if (!A.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / A.size;
}

/** Drop isnad noise — keep last speech / quote-ish segment. */
function extractMatn(ar) {
  const n = normAr(ar);
  if (!n) return "";
  const parts = n.split(/\s(?:قال|يقول|قالت|ان النبي|ان رسول)\s/);
  const last = (parts[parts.length - 1] || n).trim();
  const words = last.split(" ").filter(Boolean);
  if (words.length > 80) return words.slice(-80).join(" ");
  return last;
}

function matchScore(seedAr, encAr) {
  const matnS = extractMatn(seedAr);
  const matnE = extractMatn(encAr);
  return Math.max(
    jaccard(seedAr, encAr),
    jaccard(matnS, matnE),
    jaccard(matnS, encAr),
    containment(matnS, encAr) * 0.92,
    containment(seedAr, encAr) * 0.88
  );
}

function collectionFromAttribution(attr) {
  const a = String(attr || "");
  const hasB = /بخاري|البخاري|Bukhari/i.test(a);
  const hasM = /مسلم|مسلم|Muslim/i.test(a);
  if (hasB && !hasM) return "bukhari";
  if (hasM && !hasB) return "muslim";
  if (hasB && hasM) return "bukhari"; // متفق عليه → ship under bukhari tab
  return null;
}

async function listAllIds() {
  const cats = await getJson("https://hadeethenc.com/api/v1/categories/list/?language=ky");
  const roots = (cats || []).filter((c) => c.parent_id == null);
  const ids = new Set();
  for (const cat of roots) {
    const perPage = 50;
    let page = 1;
    let last = 1;
    do {
      const list = await getJson(
        `https://hadeethenc.com/api/v1/hadeeths/list/?language=ky&category_id=${cat.id}&page=${page}&per_page=${perPage}`
      );
      last = Number(list?.meta?.last_page || 1);
      for (const row of list?.data || []) {
        const tr = row.translations || [];
        if (tr.includes("ky") && tr.includes("uz")) ids.add(String(row.id));
      }
      page += 1;
      await sleep(30);
    } while (page <= last);
    console.log(`cat ${cat.id} (${cat.title}): ids=${ids.size}`);
  }
  console.log(`unique ky+uz ids: ${ids.size}`);
  return [...ids];
}

async function buildIndex(force) {
  if (!force && fs.existsSync(CACHE)) {
    return JSON.parse(fs.readFileSync(CACHE, "utf8"));
  }
  const ids = await listAllIds();
  const index = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    try {
      const ar = await getJson(`https://hadeethenc.com/api/v1/hadeeths/one/?id=${id}&language=ar`);
      const textAr = String(ar.hadeeth || ar.hadeeth_ar || "").trim();
      if (textAr) {
        index.push({
          id,
          ar: textAr,
          attribution: ar.attribution || ar.attribution_ar || "",
          grade: ar.grade || ar.grade_ar || "",
        });
      }
    } catch (e) {
      console.warn("skip", id, e.message);
    }
    if ((i + 1) % 25 === 0) console.log(`indexed ${i + 1}/${ids.length}`);
    await sleep(60);
  }
  fs.writeFileSync(CACHE, JSON.stringify(index));
  console.log("wrote cache", CACHE, index.length);
  return index;
}

async function fetchLocale(id, language) {
  const o = await getJson(`https://hadeethenc.com/api/v1/hadeeths/one/?id=${id}&language=${language}`);
  return {
    text: String(o.hadeeth || "").trim(),
    attribution: o.attribution || o.attribution_ar || "",
    grade: o.grade || o.grade_ar || "",
    title: o.title || "",
  };
}

function bestMatch(ar, index) {
  let best = null;
  let bestScore = 0;
  let second = 0;
  for (const row of index) {
    const score = matchScore(ar, row.ar);
    if (score > bestScore) {
      second = bestScore;
      bestScore = score;
      best = row;
    } else if (score > second) {
      second = score;
    }
  }
  return { best, bestScore, second };
}

async function main() {
  const force = process.argv.includes("--force-index");
  const expand = process.argv.includes("--expand");
  const fillRu = process.argv.includes("--fill-ru");
  const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
  const hadiths = seed.hadiths || [];
  const index = await buildIndex(force);
  const usedEncIds = new Set(
    hadiths.filter((h) => h.hadeethEncId).map((h) => String(h.hadeethEncId))
  );

  let hitKy = 0;
  let hitUz = 0;
  let hitRu = 0;
  let miss = 0;
  const MATCH_MIN = 0.38;
  const MATCH_CLEAR_GAP = 0.04;

  for (let i = 0; i < hadiths.length; i++) {
    const h = hadiths[i];
    const ar = h.arabic || "";
    const { best, bestScore, second } = bestMatch(ar, index);
    const ambiguous = bestScore - second < MATCH_CLEAR_GAP && bestScore < 0.55;
    process.stdout.write(
      `[${i + 1}/${hadiths.length}] ${h.id} score=${bestScore.toFixed(2)} gap=${(bestScore - second).toFixed(2)} `
    );
    if (!best || bestScore < MATCH_MIN || ambiguous) {
      miss++;
      console.log(ambiguous ? "AMBIG" : "MISS");
      if (fillRu && h.hadeethEncId && !(h.textRu || "").trim()) {
        try {
          const ru = await fetchLocale(h.hadeethEncId, "ru");
          await sleep(50);
          if (ru.text) {
            h.textRu = ru.text;
            hitRu++;
            console.log("  fill-ru ok via existing enc", h.hadeethEncId);
          }
        } catch (e) {
          console.log("  fill-ru ERR", e.message);
        }
      }
      continue;
    }
    try {
      if (!(h.textKy || "").trim()) {
        const ky = await fetchLocale(best.id, "ky");
        await sleep(50);
        if (ky.text) {
          h.textKy = ky.text;
          hitKy++;
          process.stdout.write("ky=ok ");
        } else process.stdout.write("ky=empty ");
      } else process.stdout.write("ky=skip ");
      if (!(h.textUz || "").trim()) {
        const uz = await fetchLocale(best.id, "uz");
        await sleep(50);
        if (uz.text) {
          h.textUz = uz.text;
          hitUz++;
          process.stdout.write("uz=ok ");
        } else process.stdout.write("uz=empty ");
      } else process.stdout.write("uz=skip ");
      if (fillRu && !(h.textRu || "").trim()) {
        const ru = await fetchLocale(best.id, "ru");
        await sleep(50);
        if (ru.text) {
          h.textRu = ru.text;
          hitRu++;
          process.stdout.write("ru=ok ");
        } else process.stdout.write("ru=empty ");
      }
      h.hadeethEncId = best.id;
      h.kyUzSourceLabel = "HadeethEnc.com";
      h.kyUzSourceAttribution = best.attribution || "HadeethEnc";
      h.matchScoreEnc = Number(bestScore.toFixed(3));
      usedEncIds.add(String(best.id));
      console.log(`enc=${best.id}`);
    } catch (e) {
      console.log("ERR", e.message);
      miss++;
    }
  }

  let expanded = 0;
  if (expand) {
    console.log("expanding catalog from HadeethEnc (bukhari/muslim attribution only)…");
    for (let i = 0; i < index.length; i++) {
      const row = index[i];
      if (usedEncIds.has(String(row.id))) continue;
      const coll = collectionFromAttribution(row.attribution);
      if (!coll) continue;
      try {
        const ky = await fetchLocale(row.id, "ky");
        await sleep(40);
        const uz = await fetchLocale(row.id, "uz");
        await sleep(40);
        if (!ky.text || !uz.text) continue;
        let textRu = "";
        if (fillRu) {
          const ru = await fetchLocale(row.id, "ru");
          await sleep(40);
          textRu = ru.text || "";
        }
        const id = `enc-${coll}-${row.id}`;
        hadiths.push({
          id,
          collection: coll,
          collectionNameKk: coll === "muslim" ? "Сахих Муслим" : "Сахих әл-Бұхари",
          bookTitleKk: "HadeethEnc.com",
          reference: String(row.id),
          arabic: row.ar,
          textKk: "",
          textRu: textRu || undefined,
          textKy: ky.text,
          textUz: uz.text,
          narratorKk: "",
          grade: row.grade || "",
          sourceCitationKk: `HadeethEnc.com · ${row.attribution || coll}`,
          kkSourceLabel: "HadeethEnc.com",
          hadeethEncId: row.id,
          kyUzSourceLabel: "HadeethEnc.com",
          kyUzSourceAttribution: row.attribution || "HadeethEnc",
          catalogOrigin: "hadeethenc",
        });
        usedEncIds.add(String(row.id));
        expanded++;
        if (expanded % 10 === 0) console.log(`expanded ${expanded}`);
      } catch (e) {
        console.warn("expand skip", row.id, e.message);
      }
    }
    console.log("expanded rows", expanded);
  }

  seed.hadiths = hadiths;
  seed.version = Math.max(Number(seed.version || 0), 9);
  seed.provenance = {
    ...(seed.provenance || {}),
    origin: "RAQAT · trusted multilingual hadith seed",
    evidenceKk:
      "Қазақша: сенімді каталог (+ HadeethEnc толықтыру ky/uz). Араб: түпнұсқа. en/tr: fawaz. ru: fawaz bukhari + HadeethEnc muslim/fallback. ky/uz: HadeethEnc.com.",
    recordedAt: new Date().toISOString(),
    licenseHint:
      "ar=original; kk=in-app catalog; en/tr=fawaz MIT; ru=fawaz+HadeethEnc; ky/uz=HadeethEnc.com — attribute, no alteration; no MT of hadith body.",
    editions: {
      ...(seed.provenance?.editions || {}),
      en: "eng-bukhari / eng-muslim (fawazahmed0)",
      ru: "rus-bukhari (fawaz) + HadeethEnc.com (ru fallback)",
      tr: "tur-bukhari / tur-muslim (fawazahmed0)",
      ar: "ara text in seed",
      kk: "kz-trusted catalog",
      ky: "HadeethEnc.com (ky)",
      uz: "HadeethEnc.com (uz)",
    },
  };

  fs.writeFileSync(SEED, JSON.stringify(seed));
  console.log("wrote", SEED);
  console.log({
    hitKy,
    hitUz,
    hitRu,
    miss,
    expanded,
    total: hadiths.length,
    withKy: hadiths.filter((h) => (h.textKy || "").trim()).length,
    withUz: hadiths.filter((h) => (h.textUz || "").trim()).length,
    withRu: hadiths.filter((h) => (h.textRu || "").trim()).length,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
