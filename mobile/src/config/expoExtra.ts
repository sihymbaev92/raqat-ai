import Constants from "expo-constants";

/**
 * app.json → extra (expoConfig) және кейбір жинақтардағы manifest.extra.
 */
export function getExpoExtra(): Record<string, unknown> | undefined {
  const a = Constants.expoConfig?.extra;
  if (a && typeof a === "object") return a as Record<string, unknown>;
  const man = (Constants as unknown as { manifest?: { extra?: Record<string, unknown> } }).manifest;
  const b = man?.extra;
  if (b && typeof b === "object") return b;
  return undefined;
}
