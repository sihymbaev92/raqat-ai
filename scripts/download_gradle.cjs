/* One-off: full redirect chain for services.gradle.org */
const https = require("https");
const http = require("http");
const fs = require("fs");
const { URL } = require("url");

// Default: Aliyun mirror (often reachable when services.gradle.org resets).
const startUrl = process.argv[2] || "https://mirrors.aliyun.com/macports/distfiles/gradle/gradle-8.14.3-bin.zip";
const dest = process.argv[3];
if (!dest) {
  console.error("Usage: node download_gradle.cjs <url> <dest-zip-path>");
  process.exit(1);
}

function follow(urlStr, max = 10) {
  if (max <= 0) return Promise.reject(new Error("too many redirects"));
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === "https:" ? https : http;
    const tmp = dest + ".downloading";
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    const file = fs.createWriteStream(tmp);
    const req = lib.get(
      u,
      {
        headers: { "User-Agent": "gradle-dl/1" },
        timeout: 0,
        rejectUnauthorized: true,
      },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          file.close();
          fs.unlinkSync(tmp);
          return resolve(follow(new URL(res.headers.location, u).href, max - 1));
        }
        if (res.statusCode !== 200) {
          file.close();
          try {
            fs.unlinkSync(tmp);
          } catch {}
          return reject(new Error("HTTP " + res.statusCode));
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          fs.renameSync(tmp, dest);
          resolve(fs.statSync(dest).size);
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(0);
  });
}

follow(startUrl)
  .then((size) => {
    console.log("OK", size, dest);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
