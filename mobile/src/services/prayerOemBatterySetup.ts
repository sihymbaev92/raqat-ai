import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OEM_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const K = {
  oemPromptAt: "raqat_oem_power_prompt_at_v1",
} as const;

type PrayerWidgetOemModule = {
  requestIgnoreBatteryOptimizationIfNeeded?: () => Promise<boolean>;
  openOemBackgroundSettings?: () => Promise<boolean>;
  getOemPowerDiagnostics?: () => Promise<{
    batteryOptimizationIgnored?: boolean;
    oemManufacturer?: string;
    oemNeedsBackgroundSetup?: boolean;
  }>;
};

function prayerWidgetModule(): PrayerWidgetOemModule | undefined {
  return NativeModules.PrayerWidget as PrayerWidgetOemModule | undefined;
}

export type OemPowerDiagnostics = {
  batteryOptimizationIgnored: boolean | null;
  oemManufacturer: string | null;
  oemNeedsBackgroundSetup: boolean | null;
};

export type OemPowerSetupResult = {
  batteryOptimizationIgnored: boolean;
  openedBatteryWhitelistScreen: boolean;
  openedOemBackgroundScreen: boolean;
  oemManufacturer: string | null;
  oemNeedsBackgroundSetup: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getOemPowerDiagnostics(): Promise<OemPowerDiagnostics> {
  if (Platform.OS !== "android") {
    return {
      batteryOptimizationIgnored: null,
      oemManufacturer: null,
      oemNeedsBackgroundSetup: null,
    };
  }
  try {
    const diag = await prayerWidgetModule()?.getOemPowerDiagnostics?.();
    return {
      batteryOptimizationIgnored:
        typeof diag?.batteryOptimizationIgnored === "boolean" ? diag.batteryOptimizationIgnored : null,
      oemManufacturer: typeof diag?.oemManufacturer === "string" ? diag.oemManufacturer : null,
      oemNeedsBackgroundSetup:
        typeof diag?.oemNeedsBackgroundSetup === "boolean" ? diag.oemNeedsBackgroundSetup : null,
    };
  } catch {
    return {
      batteryOptimizationIgnored: null,
      oemManufacturer: null,
      oemNeedsBackgroundSetup: null,
    };
  }
}

export async function isOemPowerSetupLikelySatisfied(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  const diag = await getOemPowerDiagnostics();
  if (diag.batteryOptimizationIgnored === true) return true;
  if (diag.oemNeedsBackgroundSetup !== true) return diag.batteryOptimizationIgnored !== false;
  return false;
}

async function shouldPromptOemBackground(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(K.oemPromptAt);
  if (!raw) return true;
  const ts = Date.parse(raw);
  return !Number.isFinite(ts) || Date.now() - ts > OEM_PROMPT_COOLDOWN_MS;
}

async function markOemBackgroundPrompted(): Promise<void> {
  await AsyncStorage.setItem(K.oemPromptAt, new Date().toISOString());
}

/** Samsung/Xiaomi/Huawei — батарея whitelist + OEM autostart экрандары. */
export async function ensureOemPowerSetupForAzan(opts?: {
  openSystemScreens?: boolean;
  /** Бірінші іске қосуда батарея диалогын міндетті түрде сұрау. */
  forceBatteryPrompt?: boolean;
}): Promise<OemPowerSetupResult> {
  const openSystemScreens = opts?.openSystemScreens !== false;
  const forceBatteryPrompt = opts?.forceBatteryPrompt === true;
  const rejected: OemPowerSetupResult = {
    batteryOptimizationIgnored: true,
    openedBatteryWhitelistScreen: false,
    openedOemBackgroundScreen: false,
    oemManufacturer: null,
    oemNeedsBackgroundSetup: false,
  };
  if (Platform.OS !== "android") return rejected;

  let diag = await getOemPowerDiagnostics();
  let openedBatteryWhitelistScreen = false;
  let openedOemBackgroundScreen = false;

  const needsBattery =
    forceBatteryPrompt ||
    diag.batteryOptimizationIgnored === false ||
    diag.batteryOptimizationIgnored == null;

  if (
    openSystemScreens &&
    needsBattery &&
    diag.batteryOptimizationIgnored !== true &&
    typeof prayerWidgetModule()?.requestIgnoreBatteryOptimizationIfNeeded === "function"
  ) {
    try {
      openedBatteryWhitelistScreen = Boolean(
        await prayerWidgetModule()!.requestIgnoreBatteryOptimizationIfNeeded!()
      );
      if (openedBatteryWhitelistScreen) await sleep(700);
    } catch {
      /* */
    }
    diag = await getOemPowerDiagnostics();
  }

  const needsOem = diag.oemNeedsBackgroundSetup === true;

  if (
    openSystemScreens &&
    needsOem &&
    (forceBatteryPrompt || (await shouldPromptOemBackground())) &&
    typeof prayerWidgetModule()?.openOemBackgroundSettings === "function"
  ) {
    try {
      openedOemBackgroundScreen = Boolean(await prayerWidgetModule()!.openOemBackgroundSettings!());
      if (openedOemBackgroundScreen) {
        await markOemBackgroundPrompted();
        await sleep(500);
      }
    } catch {
      /* */
    }
    diag = await getOemPowerDiagnostics();
  }

  return {
    batteryOptimizationIgnored: diag.batteryOptimizationIgnored === true,
    openedBatteryWhitelistScreen,
    openedOemBackgroundScreen,
    oemManufacturer: diag.oemManufacturer,
    oemNeedsBackgroundSetup: diag.oemNeedsBackgroundSetup === true,
  };
}

export async function openOemBackgroundSettings(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    return Boolean(await prayerWidgetModule()?.openOemBackgroundSettings?.());
  } catch {
    return false;
  }
}

export async function openBatteryOptimizationWhitelist(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    return Boolean(await prayerWidgetModule()?.requestIgnoreBatteryOptimizationIfNeeded?.());
  } catch {
    return false;
  }
}

export function resetOemPowerPromptCooldown(): void {
  void AsyncStorage.removeItem(K.oemPromptAt);
}
