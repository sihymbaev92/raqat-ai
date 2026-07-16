// Expo Metro config with startup-focused lazy module evaluation.
// inlineRequires delays rarely used screen/content modules until they are actually opened.
const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const bundledJsonDir = path.join(__dirname, "assets", "bundled");

const previousGetTransformOptions = config.transformer.getTransformOptions;
config.transformer.getTransformOptions = async (...args) => {
  const previous = previousGetTransformOptions
    ? await previousGetTransformOptions(...args)
    : {};
  return {
    ...previous,
    transform: {
      ...(previous.transform ?? {}),
      inlineRequires: true,
    },
  };
};

/** Web dev: serve large offline JSON from repo (not CDN) at /assets/bundled/*.json */
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    const url = req.url ?? "";
    const match = url.match(/^\/assets\/bundled\/([^?]+)$/);
    if (match) {
      const fileName = decodeURIComponent(match[1]);
      if (!/^[a-z0-9._-]+\.json$/i.test(fileName)) {
        res.statusCode = 400;
        res.end("invalid bundled json path");
        return;
      }
      const filePath = path.join(bundledJsonDir, fileName);
      if (filePath.startsWith(bundledJsonDir) && fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=3600");
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }
    return middleware(req, res, next);
  };
};

module.exports = config;
