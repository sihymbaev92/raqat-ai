/**
 * Expo конфиг: app.json негізгі мәліметтер; extra.* үшін build кезінде
 * EXPO_PUBLIC_* (Metro бандлы) және осы жердегі мән бірдей болуы керек.
 * Production: mobile/.env.production немесе EAS env арқылы EXPO_PUBLIC_RAQAT_API_BASE беріңіз.
 * Донат/қолдау URL: EXPO_PUBLIC_RAQAT_DONATION_URL (қосылғанда extra.raqatDonationUrl үстінен жазады; әйтпесе app.json extra.raqatDonationUrl).
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appJson = require("./app.json");

function trimBase(s) {
  if (!s || typeof s !== "string") return "";
  return s.trim().replace(/\/+$/, "");
}

function trimSecret(s) {
  if (!s || typeof s !== "string") return "";
  return s.trim();
}

function isLocalhostUrl(s) {
  const t = (s || "").toLowerCase();
  return t.includes("127.0.0.1") || t.includes("localhost");
}

module.exports = () => {
  const expo = JSON.parse(JSON.stringify(appJson.expo));
  const extra = { ...(expo.extra || {}) };

  const apiEnv = trimBase(process.env.EXPO_PUBLIC_RAQAT_API_BASE);
  const aiEnv = trimSecret(process.env.EXPO_PUBLIC_RAQAT_AI_SECRET);
  const contentEnv = trimSecret(process.env.EXPO_PUBLIC_RAQAT_CONTENT_SECRET);
  const donationEnv = (process.env.EXPO_PUBLIC_RAQAT_DONATION_URL || "").trim();

  if (apiEnv) {
    extra.raqatApiBase = apiEnv;
  } else if (isLocalhostUrl(extra.raqatApiBase)) {
    /** Тек конфигте localhost қалғанда — бандлда бос қалдырмау үшін тазалау (getRaqatApiBase fallback) */
    extra.raqatApiBase = "";
  }

  if (aiEnv) extra.raqatAiSecret = aiEnv;
  if (contentEnv) extra.raqatContentSecret = contentEnv;
  if (donationEnv) extra.raqatDonationUrl = donationEnv;

  expo.extra = extra;
  return { expo };
};
