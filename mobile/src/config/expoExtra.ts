import Constants from "expo-constants";

/**
 * app.json → extra (expoConfig) және EAS/standalone-дағы embedded manifest.extra.
 * Кей build-та тек manifest қалады; expoConfig null болуы мүмкін.
 */
export function getExpoExtra(): Record<string, unknown> | undefined {
  const a = Constants.expoConfig?.extra;
  if (a && typeof a === "object") return a as Record<string, unknown>;
  const m = Constants.manifest;
  if (m && typeof m === "object" && "extra" in m) {
    const b = (m as { extra?: unknown }).extra;
    if (b && typeof b === "object") return b as Record<string, unknown>;
  }
  return undefined;
}
