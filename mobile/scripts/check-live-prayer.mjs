const commonUrl =
  "https://rahatomir.com/_expo/static/js/web/__common-1c683aeb9a222d42856060c699461166.js";
const res = await fetch(commonUrl);
const s = await res.text();
console.log("common status", res.status, "len", s.length);
console.log("blockAladhan", s.includes("Muftyat schedule unavailable"));
console.log("muftyatApi", s.includes("api.muftyat.kz/prayer-times"));
