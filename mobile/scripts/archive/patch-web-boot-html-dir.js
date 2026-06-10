#!/usr/bin/env node
/** Patch index.html in a given export dir (default: dist). */
const fs = require("fs");
const path = require("path");

const outDir = process.argv[2] || "dist";
const indexPath = path.join(__dirname, "..", outDir, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error("patch-web-boot-html-dir: missing", indexPath);
  process.exit(1);
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
if (html.includes("raqat-web-boot")) {
  console.log("patch-web-boot-html-dir: already patched");
  process.exit(0);
}

html = html.replace('<html lang="en">', '<html lang="kk">');
html = html.replace('<div id="root"></div>', `<div id="root">${bootBlock}</div>`);
html = html.replace(
  "</head>",
  `  <meta name="theme-color" content="#0A0E13" />\n  <meta name="description" content="RAHAT OMIR — намаз, Құран, діни қолданба" />\n</head>`
);

fs.writeFileSync(indexPath, html, "utf8");
console.log("patch-web-boot-html-dir: OK", outDir);
