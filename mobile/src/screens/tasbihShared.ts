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

/** null goal = шексіз (∞). 33×3 фазалар ∞ және 100-де көрінеді. */
export function phaseLabel(
  count: number,
  goal: number | null,
  rule: DhikrItem["phaseRule"]
): string {
  if (rule !== "triple_salah") return "";
  if (goal === 33) return "";
  if (count === 0) return kk.tasbih.phaseSubhan;
  const idx = Math.floor((count - 1) / 33) % 3;
  if (idx === 0) return kk.tasbih.phaseSubhan;
  if (idx === 1) return kk.tasbih.phaseHamd;
  return kk.tasbih.phaseTakbir;
}

export function manualToMode(manual: number | null): TasbihGoalMode {
  if (manual === 33) return "33";
  if (manual === 100) return "100";
  return "infinite";
}

/** null = шексіз санау (∞). */
export function effectiveGoalForItem(
  _item: DhikrItem | undefined,
  manual: number | null
): number | null {
  if (manual === 33 || manual === 100) return manual;
  return null;
}

export function formatTasbihProgress(count: number, goal: number | null): string {
  return goal == null ? `${count} / ∞` : `${count} / ${goal}`;
}
