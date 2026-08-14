import type { AVPlaybackSource } from "expo-av";
import { Asset } from "expo-asset";
import { Platform } from "react-native";

import { tajweedExampleAudioUri, tajweedExampleAudioUris } from "../config/tajweedAssetsBase";
import { tajweedGuideExampleAudio } from "../services/tajweedGuideDataset";
import { TAJWEED_EXAMPLE_ASSET_BY_FILE } from "./tajweedExampleAssetMap.generated";
import { TAJWEED_EXAMPLE_AUDIO_MANIFEST } from "./tajweedExampleAudioManifest.generated";

export { TAJWEED_EXAMPLE_AUDIO_MANIFEST as TAJWEED_EXAMPLE_AUDIO_BY_AR };

function bundledExampleSource(file: string): AVPlaybackSource | undefined {
  const mod = TAJWEED_EXAMPLE_ASSET_BY_FILE[file];
  if (mod == null) return undefined;
  const asset = Asset.fromModule(mod);
  const uri = asset.uri;
  return uri ? { uri } : undefined;
}

export function tajweedExampleAudioFile(exampleAr: string): string | undefined {
  const key = (exampleAr ?? "").trim().normalize("NFC");
  if (!key) return undefined;

  const guide = tajweedGuideExampleAudio(key);
  if (guide && "file" in guide && guide.file) {
    return guide.file;
  }

  const direct = TAJWEED_EXAMPLE_AUDIO_MANIFEST[key];
  if (direct) return direct;
  for (const [manifestKey, file] of Object.entries(TAJWEED_EXAMPLE_AUDIO_MANIFEST)) {
    if (manifestKey.normalize("NFC") === key) return file;
  }
  return undefined;
}

export function tajweedExampleAudioSource(exampleAr: string): AVPlaybackSource | undefined {
  const file = tajweedExampleAudioFile(exampleAr);
  if (!file) return undefined;

  const bundled = bundledExampleSource(file);
  if (bundled) return bundled;

  if (process.env.NODE_ENV === "test") {
    return { uri: tajweedExampleAudioUri(file) };
  }

  // Web dev: CDN-дегі eski буын MP3 қолданылмайды — bundled немесе TTS fallback.
  if (Platform.OS === "web") {
    return undefined;
  }

  return { uri: tajweedExampleAudioUris(file)[0] ?? tajweedExampleAudioUri(file) };
}

export function hasBundledTajweedExampleAudio(file: string): boolean {
  return TAJWEED_EXAMPLE_ASSET_BY_FILE[file] != null;
}

export function hasLocalBundledExampleAudio(exampleAr: string): boolean {
  const file = tajweedExampleAudioFile(exampleAr);
  return file != null && hasBundledTajweedExampleAudio(file);
}
