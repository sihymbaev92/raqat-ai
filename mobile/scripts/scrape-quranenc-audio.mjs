const html = await (await fetch("https://quranenc.com/ky/audio/kyrgyz_hakimov")).text();
const mp3 = [...html.matchAll(/https?:[^"'\\s]+\.mp3/gi)].map((m) => m[0]);
console.log("mp3", mp3.slice(0, 15));
const api = [...html.matchAll(/\/api\/v1\/[^"'\\s]+/g)].map((m) => m[0]);
console.log("api", [...new Set(api)].slice(0, 15));
