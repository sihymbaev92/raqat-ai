import { NativeModules, Platform } from "react-native";

export type DeviceIntegrityReport = {
  ok: boolean;
  rootedOrJailbroken: boolean;
  debuggerAttached: boolean;
  emulator: boolean;
  hookingSuspected: boolean;
  signals: string[];
  platform: string;
};

type IntegrityNative = {
  getDeviceIntegrityReport?: () => Promise<Record<string, unknown>>;
  verifyPinnedHttpsHost?: (
    host: string,
    pinsJson: string
  ) => Promise<{ ok?: boolean; skipped?: boolean; matched?: boolean; error?: string }>;
};

function prayerWidget(): IntegrityNative | undefined {
  return NativeModules.PrayerWidget as IntegrityNative | undefined;
}

function asBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

function asSignals(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean).slice(0, 32);
}

/** Қауіпсіз әдепкі — native жоқ болса «таза» деп санамаймыз, бірақ блоктамаймыз. */
export function emptyIntegrityReport(platform = Platform.OS): DeviceIntegrityReport {
  return {
    ok: true,
    rootedOrJailbroken: false,
    debuggerAttached: false,
    emulator: false,
    hookingSuspected: false,
    signals: [],
    platform,
  };
}

export async function getDeviceIntegrityReport(): Promise<DeviceIntegrityReport> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return emptyIntegrityReport("web");
  }
  const mod = prayerWidget();
  if (typeof mod?.getDeviceIntegrityReport !== "function") {
    return emptyIntegrityReport();
  }
  try {
    const raw = await mod.getDeviceIntegrityReport();
    const rootedOrJailbroken = asBool(raw?.rootedOrJailbroken);
    const debuggerAttached = asBool(raw?.debuggerAttached);
    const emulator = asBool(raw?.emulator);
    const hookingSuspected = asBool(raw?.hookingSuspected);
    const signals = asSignals(raw?.signals);
    const compromised = rootedOrJailbroken || debuggerAttached || hookingSuspected;
    return {
      ok: !compromised,
      rootedOrJailbroken,
      debuggerAttached,
      emulator,
      hookingSuspected,
      signals,
      platform: Platform.OS,
    };
  } catch {
    return emptyIntegrityReport();
  }
}

export async function verifyPinnedHttpsHost(
  host: string,
  pins: readonly string[]
): Promise<{ ok: boolean; skipped: boolean; matched: boolean; error?: string }> {
  if (!pins.length) return { ok: true, skipped: true, matched: false };
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return { ok: true, skipped: true, matched: false };
  }
  const mod = prayerWidget();
  if (typeof mod?.verifyPinnedHttpsHost !== "function") {
    return { ok: true, skipped: true, matched: false };
  }
  try {
    const r = await mod.verifyPinnedHttpsHost(host, JSON.stringify(pins));
    return {
      ok: r?.ok !== false,
      skipped: Boolean(r?.skipped),
      matched: Boolean(r?.matched),
      error: typeof r?.error === "string" ? r.error : undefined,
    };
  } catch (e) {
    return {
      ok: false,
      skipped: false,
      matched: false,
      error: e instanceof Error ? e.message : "pin_verify_failed",
    };
  }
}
