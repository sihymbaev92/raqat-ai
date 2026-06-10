import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "raqat_ai_long_timeouts_v1";

export async function getAiLongTimeoutsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setAiLongTimeoutsEnabled(on: boolean): Promise<void> {
  try {
    if (on) await AsyncStorage.setItem(KEY, "1");
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
