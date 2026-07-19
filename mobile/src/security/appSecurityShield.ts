import { Platform } from "react-native";
import {
  getDeviceIntegrityReport,
  verifyPinnedHttpsHost,
  type DeviceIntegrityReport,
} from "./deviceIntegrity";
import { RAQAT_API_PIN_HOSTS, RAQAT_API_TLS_PINS } from "./tlsPinConfig";

export type AppSecurityPosture = {
  evaluatedAt: number;
  integrity: DeviceIntegrityReport;
  /** Release-та root/jailbreak/hook/debugger → true */
  blockSensitiveAuth: boolean;
  pinOk: boolean;
  pinSkipped: boolean;
  reasons: string[];
};

let posture: AppSecurityPosture | null = null;
let evaluatePromise: Promise<AppSecurityPosture> | null = null;

function releaseEnforce(): boolean {
  return typeof __DEV__ === "undefined" || !__DEV__;
}

export function getCachedSecurityPosture(): AppSecurityPosture | null {
  return posture;
}

export function isSensitiveAuthBlocked(): boolean {
  return Boolean(posture?.blockSensitiveAuth);
}

/**
 * Құрылғы тұтастығы + (опциялық) TLS pin.
 * Release: компрометацияда аккаунт токендерін қолданбау / сақтамау.
 */
export async function evaluateAppSecurityPosture(force = false): Promise<AppSecurityPosture> {
  if (!force && posture && Date.now() - posture.evaluatedAt < 45_000) {
    return posture;
  }
  if (!force && evaluatePromise) return evaluatePromise;

  evaluatePromise = (async () => {
    const integrity = await getDeviceIntegrityReport();
    const reasons: string[] = [];

    if (integrity.rootedOrJailbroken) reasons.push("rooted_or_jailbroken");
    if (integrity.debuggerAttached) reasons.push("debugger");
    if (integrity.hookingSuspected) reasons.push("hooking");

    let pinOk = true;
    let pinSkipped = true;
    if (RAQAT_API_TLS_PINS.length > 0 && (Platform.OS === "android" || Platform.OS === "ios")) {
      const host = RAQAT_API_PIN_HOSTS[0] ?? "api.rahatomir.com";
      const pin = await verifyPinnedHttpsHost(host, RAQAT_API_TLS_PINS);
      pinSkipped = pin.skipped;
      pinOk = pin.ok;
      if (!pin.ok && !pin.skipped) reasons.push("tls_pin_mismatch");
    }

    const enforce = releaseEnforce();
    const blockSensitiveAuth =
      enforce &&
      (integrity.rootedOrJailbroken ||
        integrity.debuggerAttached ||
        integrity.hookingSuspected ||
        (!pinOk && !pinSkipped));

    const next: AppSecurityPosture = {
      evaluatedAt: Date.now(),
      integrity,
      blockSensitiveAuth,
      pinOk,
      pinSkipped,
      reasons,
    };
    posture = next;

    if (blockSensitiveAuth) {
      try {
        const { clearLoginTokens } = await import("../storage/authTokens");
        await clearLoginTokens();
      } catch {
        /* */
      }
    }

    return next;
  })();

  try {
    return await evaluatePromise;
  } finally {
    evaluatePromise = null;
  }
}

/** Токен сақтау алдында — компрометацияда тыйым. */
export async function assertCanPersistAuthSecrets(): Promise<void> {
  const p = await evaluateAppSecurityPosture();
  if (p.blockSensitiveAuth) {
    throw new Error("SECURITY_BLOCKED_DEVICE");
  }
}

/** Жұмыс үстеліндегі қауіпті deep link жолдарын сүзу. */
export function isTrustedAppDeepLinkPath(path: string): boolean {
  const raw = (path || "").trim();
  if (!raw) return true;
  const normalized = raw.replace(/^\/+/, "").toLowerCase();
  // Сыртқы қолданбаның профиль/аккаунт бетіне мәжбүрлі ашуы — өшіру
  if (
    normalized === "profile" ||
    normalized.startsWith("profile?") ||
    normalized.startsWith("profile/") ||
    normalized.includes("account") ||
    normalized.includes("login") ||
    normalized.includes("oauth")
  ) {
    return false;
  }
  return true;
}
