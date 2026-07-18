/**
 * Verifies every playable picker reciter resolves to a playable MP3 (same URLs as the app).
 * Usage: node mobile/scripts/verify-quran-reciters-cdn.mjs
 */

/** Keep in sync with `src/config/quranReciters.ts` playable editions. */
const EDITIONS = [
  "kk.khalifahaltai-audio",
  "ru.kuliev-audio",
  "en.walk",
  "tr.vakfi-audio",
  "ky.hakimov-audio",
  "uz.rwwad-audio",
  "ar.abdurrahmaansudais",
  "ar.abdulbasitmurattal",
  "ar.husary",
  "ar.alafasy",
  "ar.mahermuaiqly",
  "ar.minshawi",
  "ar.hudhaify",
  "ar.ahmedajamy",
  "ar.shaatree",
  "ar.muhammadayyoub",
];

const RAQAT_HOSTED = new Set(["ky.hakimov-audio", "uz.rwwad-audio"]);
const RAQAT_AUDIO_BASE = "https://rahatomir.com/assets/quran/audio";
const CDN_AYAH_192 = new Set(["ar.abdurrahmaansudais", "ar.abdulbasitmurattal", "en.walk"]);
const SAMPLE_AYAHS = [1, 8, 255, 6236];

const QURAN_COM_TIMED = {
  "ar.abdurrahmaansudais": (key) => `https://verses.quran.com/Sudais/mp3/${key}.mp3`,
  "ar.abdulbasitmurattal": (key) => `https://verses.quran.com/AbdulBaset/Murattal/mp3/${key}.mp3`,
  "ar.husary": (key) => `https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/${key}.mp3`,
  "ar.alafasy": (key) => `https://verses.quran.com/Alafasy/mp3/${key}.mp3`,
};

function globalAyahToRef(n) {
  if (n === 1) return { surah: 1, ayah: 1 };
  if (n === 8) return { surah: 2, ayah: 1 };
  if (n === 255) return { surah: 2, ayah: 255 };
  if (n === 6236) return { surah: 114, ayah: 6 };
  return { surah: 1, ayah: 1 };
}

function paddedAyahKey(globalAyahOneBased) {
  const { surah, ayah } = globalAyahToRef(globalAyahOneBased);
  return `${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}`;
}

function cdnAyahBitrateKbps(edition) {
  const e = edition.trim().toLowerCase();
  if (e.startsWith("en.") || CDN_AYAH_192.has(e)) return 192;
  if (
    e.startsWith("kk.") ||
    e.startsWith("ru.") ||
    e.startsWith("tr.") ||
    e.startsWith("ky.") ||
    e.startsWith("uz.")
  ) {
    return 128;
  }
  return 128;
}

function quranAyahMp3Url(globalAyah, edition) {
  const key = paddedAyahKey(globalAyah);
  const timed = QURAN_COM_TIMED[edition];
  if (timed) return timed(key);
  const br = cdnAyahBitrateKbps(edition);
  if (RAQAT_HOSTED.has(edition)) {
    return `${RAQAT_AUDIO_BASE}/${br}/${edition}/${globalAyah}.mp3`;
  }
  return `https://cdn.islamic.network/quran/audio/${br}/${edition}/${globalAyah}.mp3`;
}

const results = [];
let failed = 0;

for (const edition of EDITIONS) {
  for (const ayah of SAMPLE_AYAHS) {
    const url = quranAyahMp3Url(ayah, edition);
    let status = 0;
    let ctype = "";
    let bytes = 0;
    try {
      const res = await fetch(url, { redirect: "follow" });
      status = res.status;
      ctype = res.headers.get("content-type") ?? "";
      if (res.ok) {
        const buf = await res.arrayBuffer();
        bytes = buf.byteLength;
      }
    } catch (e) {
      status = -1;
      ctype = String(e?.message ?? e);
    }
    const ok = status === 200 && bytes > 1000;
    if (!ok) failed += 1;
    results.push({ edition, ayah, url, status, ctype, bytes, ok });
  }
}

console.log("== Quran reciter CDN verify ==");
console.log(`Reciters: ${EDITIONS.length} · samples/ayah: ${SAMPLE_AYAHS.length}`);
for (const edition of EDITIONS) {
  const rows = results.filter((r) => r.edition === edition);
  const bad = rows.filter((r) => !r.ok);
  const mark = bad.length === 0 ? "OK" : "FAIL";
  console.log(`\n[${mark}] ${edition}`);
  for (const r of rows) {
    console.log(
      `  ayah ${String(r.ayah).padStart(4)} · HTTP ${r.status} · ${Math.round(r.bytes / 1024)} KB`
    );
    if (!r.ok) console.log(`         ${r.url}\n         ctype=${r.ctype}`);
  }
}

if (failed > 0) {
  console.log(`\nFAIL: ${failed} URL(s) broken`);
  process.exit(1);
}
console.log("\nOK: all reciter sample URLs playable");
