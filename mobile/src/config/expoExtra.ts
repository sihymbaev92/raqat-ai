import Constants from "expo-constants";

/**
 * app.json → extra (expoConfig) және EAS/standalone-дағы embedded manifest.extra.
 * Кей build-та `expoConfig` бос, ал `extra` тек `manifest` / `manifest2`-да болуы мүмкін
 * (Android кірістірілген манифест, EAS OTA — нұсқаға байланысты).
 */
function extraFrom(obj: unknown): Record<string, unknown> | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const x = (obj as { extra?: unknown }).extra;
  if (x && typeof x === "object") return x as Record<string, unknown>;
  return undefined;
}

export function getExpoExtra(): Record<string, unknown> | undefined {
  const a = extraFrom(Constants.expoConfig);
  if (a) return a;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const C = Constants as any;
  const b = extraFrom(C.manifest2);
  if (b) return b;
  const c = extraFrom(C.manifest);
  if (c) return c;
  return undefined;
}
