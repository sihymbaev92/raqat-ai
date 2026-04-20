import { kk } from "../i18n/kk";
import type { TasbihGoalMode } from "../storage/prefs";

export type DhikrItem = {
  id: number;
  slug: string;
  textAr: string;
  textKk: string;
  translitKk?: string;
  meaningKk?: string;
  defaultTarget: number;
  phaseRule: "triple_salah" | null;
};

type DhikrBundle = { version: number; items: DhikrItem[] };

export function loadDhikrItems(): DhikrItem[] {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const raw = require("../../assets/bundled/dhikr-list.json") as DhikrBundle;
    /* eslint-enable @typescript-eslint/no-require-imports */
    if (!raw?.items?.length) return [];
    return raw.items;
  } catch {
    return [];
  }
}

export function phaseLabel(count: number, goal: number, rule: DhikrItem["phaseRule"]): string {
  if (rule !== "triple_salah" || goal !== 99) return "";
  if (count === 0) return kk.tasbih.phaseSubhan;
  const idx = Math.floor((count - 1) / 33) % 3;
  if (idx === 0) return kk.tasbih.phaseSubhan;
  if (idx === 1) return kk.tasbih.phaseHamd;
  return kk.tasbih.phaseTakbir;
}

export function manualToMode(manual: number | null): TasbihGoalMode {
  if (manual === 33) return "33";
  if (manual === 99) return "99";
  return "default";
}

export function effectiveGoalForItem(item: DhikrItem | undefined, manual: number | null): number {
  if (!item) return 33;
  if (item.phaseRule === "triple_salah") return 99;
  if (manual === 33 || manual === 99) return manual;
  const d = item.defaultTarget || 33;
  return Math.max(1, Math.min(d, 999));
}
