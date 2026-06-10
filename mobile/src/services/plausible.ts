import { Platform } from "react-native";

const PLAUSIBLE_DOMAIN = (process.env.EXPO_PUBLIC_PLAUSIBLE_DOMAIN ?? "").trim();
const PLAUSIBLE_SCRIPT_URL =
  (process.env.EXPO_PUBLIC_PLAUSIBLE_SCRIPT_URL ?? "https://plausible.io/js/script.js").trim();

type PlausibleFn = (
  event: string,
  options?: { u?: string; props?: Record<string, string | number | boolean> }
) => void;

function getPlausible(): PlausibleFn | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const w = window as Window & { plausible?: PlausibleFn };
  return typeof w.plausible === "function" ? w.plausible : null;
}

export function isPlausibleEnabled(): boolean {
  return Platform.OS === "web" && PLAUSIBLE_DOMAIN.length > 0;
}

export function getPlausibleDomain(): string {
  return PLAUSIBLE_DOMAIN;
}

export function getPlausibleScriptUrl(): string {
  return PLAUSIBLE_SCRIPT_URL;
}

/** SPA маршрут ауысымында pageview (Plausible script index.html-де). */
export function trackPlausiblePageview(path: string): void {
  if (!isPlausibleEnabled()) return;
  const fn = getPlausible();
  if (!fn) return;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  const url = origin ? `${origin}${normalized}` : normalized;
  fn("pageview", { u: url });
}

/** Экран/оқиға — Plausible custom event. */
export function trackPlausibleEvent(
  name: string,
  props?: Record<string, string | number | boolean>
): void {
  if (!isPlausibleEnabled()) return;
  const fn = getPlausible();
  if (!fn) return;
  if (props && Object.keys(props).length > 0) {
    fn(name, { props });
  } else {
    fn(name);
  }
}
