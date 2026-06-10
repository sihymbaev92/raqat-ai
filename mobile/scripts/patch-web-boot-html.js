#!/usr/bin/env node
/** Expo export index.html — JS жүктелгенше көрінетін boot экраны. */
const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "dist", "index.html");
if (!fs.existsSync(indexPath)) {
  console.error("patch-web-boot-html: dist/index.html жоқ");
  process.exit(1);
}

function plausibleHeadSnippet() {
  const domain = (process.env.EXPO_PUBLIC_PLAUSIBLE_DOMAIN || "").trim();
  if (!domain) return "";
  const scriptUrl = (
    process.env.EXPO_PUBLIC_PLAUSIBLE_SCRIPT_URL || "https://plausible.io/js/script.js"
  ).trim();
  return `\n  <script defer data-domain="${domain}" src="${scriptUrl}"></script>`;
}

const bootBlock = `
    <div id="raqat-web-boot" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:100vh;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0A0E13;color:#EEF2F6;text-align:center;padding:24px;box-sizing:border-box;">
      <p style="font-size:20px;font-weight:800;margin:0 0 10px;letter-spacing:0.04em;">RAHAT OMIR</p>
      <p id="raqat-boot-hint" style="font-size:14px;opacity:0.88;margin:0;line-height:1.5;">Жүктелуде…</p>
    </div>
    <script>
      setTimeout(function(){var h=document.getElementById("raqat-boot-hint");if(h)h.textContent="Бір минутқа жақын уақыт алуы мүмкін. Интернетті тексеріңіз.";},15000);
      window.addEventListener("error",function(e){var h=document.getElementById("raqat-boot-hint");if(h)h.textContent="Қате: "+(e&&e.message?e.message:"JavaScript");});
    </script>`;

let html = fs.readFileSync(indexPath, "utf8");
const buildId = (process.env.RAQAT_WEB_BUILD_ID || `${Date.now()}`).trim();
function withScriptCacheBust(input) {
  return input.replace(
    /src="(\/_expo\/static\/js\/web\/[^"]+\.js)(?:\?rv=[^"]*)?"/g,
    `src="$1?rv=${buildId}"`
  );
}

if (html.includes("raqat-web-boot")) {
  fs.writeFileSync(indexPath, withScriptCacheBust(html), "utf8");
  console.log("patch-web-boot-html: already patched");
  process.exit(0);
}

html = html.replace("<html lang=\"en\">", "<html lang=\"kk\">");
html = html.replace(
  "<div id=\"root\"></div>",
  `<div id="root">${bootBlock}</div>`
);
const plausible = plausibleHeadSnippet();
html = html.replace(
  "</head>",
  `  <meta name="theme-color" content="#0A0E13" />\n  <meta name="description" content="RAHAT OMIR — намаз, Құран, діни қолданба" />${plausible}\n</head>`
);
if (plausible) {
  console.log("patch-web-boot-html: Plausible", (process.env.EXPO_PUBLIC_PLAUSIBLE_DOMAIN || "").trim());
}

fs.writeFileSync(indexPath, html, "utf8");
fs.writeFileSync(indexPath, withScriptCacheBust(html), "utf8");
console.log("patch-web-boot-html: OK");
