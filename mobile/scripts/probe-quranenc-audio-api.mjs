const edition = "kyrgyz_hakimov";
const paths = [
  `/api/v1/translation/ayah/${edition}/1/1/audio`,
  `/api/v1/translation/ayah/${edition}/1/1`,
  `/api/v1/audio/translation/${edition}/1/1`,
  `/api/v1/audio/ayah/${edition}/1/1`,
  `/api/v1/translation/audio/${edition}/1/1`,
];

for (const p of paths) {
  const url = `https://quranenc.com${p}`;
  const res = await fetch(url);
  const ct = res.headers.get("content-type") ?? "";
  let body = "";
  if (ct.includes("json")) body = JSON.stringify(await res.json()).slice(0, 180);
  else body = (await res.text()).slice(0, 120);
  console.log(res.status, p, body);
}

const uzEdition = "uzbek_sodik";
for (const surah of [1, 2]) {
  const url = `https://quranenc.com/api/v1/translation/sura/${uzEdition}/${surah}/audio`;
  const res = await fetch(url);
  console.log("uz sura", surah, res.status, res.headers.get("content-type"));
}
