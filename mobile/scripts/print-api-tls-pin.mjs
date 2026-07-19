/**
 * Print leaf X.509 DER SHA-256 pins (matches Android cert.encoded / iOS SecCertificateCopyData).
 * Usage: node scripts/print-api-tls-pin.mjs [host]
 */
const host = process.argv[2] || "api.rahatomir.com";
const tls = require("tls");
const crypto = require("crypto");

const socket = tls.connect(
  { host, port: 443, servername: host, rejectUnauthorized: true },
  () => {
    const cert = socket.getPeerCertificate(true);
    socket.end();
    if (!cert || !cert.raw) {
      console.error("No certificate for", host);
      process.exit(1);
    }
    const hash = crypto.createHash("sha256").update(cert.raw).digest("base64");
    console.log(`Host: ${host}`);
    console.log(`Pin:  sha256/${hash}`);
    console.log(`Add to src/security/tlsPinConfig.ts (keep previous pin as backup for rotation).`);
    process.exit(0);
  }
);
socket.on("error", (e) => {
  console.error(e.message || e);
  process.exit(1);
});
setTimeout(() => {
  console.error("timeout");
  process.exit(1);
}, 20000);
