import Constants from "expo-constants";
import { Platform } from "react-native";
import { getRaqatApiBase } from "../config/raqatApiBase";

type ClientErrorKind = "render" | "unhandled" | "manual";

type ClientErrorReportInput = {
  kind: ClientErrorKind;
  error: unknown;
  componentStack?: string | null;
  route?: string | null;
};

function trim(value: unknown, limit: number): string | undefined {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  return text.slice(0, limit);
}

function errorName(error: unknown): string | undefined {
  if (error instanceof Error) return trim(error.name, 120);
  return undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return trim(error.message, 800) ?? "Unknown error";
  return trim(error, 800) ?? "Unknown error";
}

function errorStack(error: unknown): string | undefined {
  if (error instanceof Error) return trim(error.stack, 1600);
  return undefined;
}

export async function reportClientError(input: ClientErrorReportInput): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const constantsWithDeviceName = Constants as typeof Constants & { deviceName?: string };
  const body = {
    kind: input.kind,
    platform: Platform.OS,
    appVersion: trim(Constants.expoConfig?.version, 32),
    buildNumber: trim(
      Platform.OS === "android"
        ? Constants.expoConfig?.android?.versionCode
        : Constants.expoConfig?.ios?.buildNumber,
      32
    ),
    errorName: errorName(input.error),
    message: errorMessage(input.error),
    stack: errorStack(input.error),
    componentStack: trim(input.componentStack, 1600),
    route: trim(input.route, 160),
    deviceModel: trim(constantsWithDeviceName.deviceName, 120),
  };

  try {
    await fetch(`${base.replace(/\/+$/, "")}/api/v1/client/errors`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Crash reporting must never create a second user-visible failure.
  }
}

