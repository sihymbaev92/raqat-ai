const candidates = [
  "uz.sodik-audio",
  "uz.sodik",
  "ky.hakimov-audio",
  "ky.borubaev-audio",
  "kyrgyz.hakimov-audio",
  "kk.khalifahaltai-audio",
  "tr.vakfi-audio",
  "en.walk",
];

for (const ed of candidates) {
  for (const br of [128, 192, 64, 320]) {
    const url = `https://cdn.islamic.network/quran/audio/${br}/${ed}/1.mp3`;
    const res = await fetch(url);
    if (res.status === 200) {
      console.log("OK", br, ed);
      break;
    }
  }
}
