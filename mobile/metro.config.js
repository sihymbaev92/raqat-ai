// Expo Metro config with startup-focused lazy module evaluation.
// inlineRequires delays rarely used screen/content modules until they are actually opened.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

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

module.exports = config;
