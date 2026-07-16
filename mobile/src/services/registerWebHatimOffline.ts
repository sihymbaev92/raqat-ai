import { Platform } from "react-native";

const SW_URL = "/service-worker.js";

/** Web хатым: QCF4 JSON/қаріп кэшін service worker арқылы сақтау. */
export async function registerWebHatimOfflineServiceWorker(): Promise<void> {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    const existing = await navigator.serviceWorker.getRegistration(SW_URL);
    if (existing?.active) return;
    await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  } catch {
    /* best effort — IndexedDB fallback қолданылады */
  }
}
