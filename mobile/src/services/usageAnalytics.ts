import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getRaqatApiBase } from "../config/raqatApiBase";

const SESSION_KEY = "raqat.usage.session_id.v1";
const SEND_MIN_INTERVAL_MS = 2500;

let sessionPromise: Promise<string> | null = null;
let lastSentAt = 0;
let lastEventKey = "";

function randomSessionId(): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `raqat-${Platform.OS}-${rand}`;
}

async function usageSessionId(): Promise<string> {
  sessionPromise ??= (async () => {
    const existing = (await AsyncStorage.getItem(SESSION_KEY))?.trim();
    if (existing) return existing;
    const next = randomSessionId();
    await AsyncStorage.setItem(SESSION_KEY, next);
    return next;
  })();
  return sessionPromise;
}

function appVersion(): string | undefined {
  return Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version;
}

function buildNumber(): string | undefined {
  const android = Constants.expoConfig?.android?.versionCode;
  const ios = Constants.expoConfig?.ios?.buildNumber;
  return android != null ? String(android) : ios != null ? String(ios) : undefined;
}

export async function trackUsageEvent(input: {
  eventName: string;
  path?: string;
  screen?: string;
  detail?: string;
}): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;

  const now = Date.now();
  const key = `${input.eventName}|${input.path ?? ""}|${input.screen ?? ""}`;
  if (key === lastEventKey && now - lastSentAt < SEND_MIN_INTERVAL_MS) return;
  lastEventKey = key;
  lastSentAt = now;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const sessionId = await usageSessionId();

  await fetch(`${base.replace(/\/+$/, "")}/api/v1/client/usage`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: Platform.OS === "web" ? "web" : "app",
      eventName: input.eventName,
      sessionId,
      path: input.path,
      screen: input.screen,
      appVersion: appVersion(),
      buildNumber: buildNumber(),
      detail: input.detail,
    }),
  }).catch(() => {
    /* analytics must be silent */
  });
}

export function trackUsagePageview(path: string): void {
  setTimeout(() => {
    void trackUsageEvent({ eventName: "pageview", path });
  }, 750);
}
