const url =
  "https://rahatomir.com/_expo/static/js/web/DashboardScreen-c7f1cb00de66ee70ccae82c28dd4e4e3.js";
const res = await fetch(url);
const s = await res.text();
console.log("status", res.status, "len", s.length);
console.log("hasSunStrip", /"fajr","sun","dhuhr","asr","maghrib","isha"/.test(s));
console.log("oldStrip", /"fajr","dhuhr","asr","maghrib","isha"/.test(s));
