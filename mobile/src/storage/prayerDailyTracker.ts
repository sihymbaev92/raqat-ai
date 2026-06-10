import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "raqat_prayer_daily_tracker_v1";

/** Бес уақыт намазы (күн шығысын бақылауға алмаймыз). */
export const FARD_PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type FardPrayerKey = (typeof FARD_PRAYER_KEYS)[number];

export type PrayerDailyTrackerState = {
  streak: number;
  longest: number;
  /** Соңғы толық күн (YYYY-MM-DD) */
  lastCompleteDate: string;
  /** Ағымдағы күн */
  today: string;
  prayed: Partial<Record<FardPrayerKey, boolean>>;
};

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const emptyToday = (): PrayerDailyTrackerState => ({
  streak: 0,
  longest: 0,
  lastCompleteDate: "",
  today: todayLocal(),
  prayed: {},
});

function allFardDone(prayed: Partial<Record<FardPrayerKey, boolean>>): boolean {
  return FARD_PRAYER_KEYS.every((k) => prayed[k] === true);
}

function countDone(prayed: Partial<Record<FardPrayerKey, boolean>>): number {
  return FARD_PRAYER_KEYS.filter((k) => prayed[k] === true).length;
}

async function writeState(state: PrayerDailyTrackerState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function loadPrayerDailyTracker(): Promise<PrayerDailyTrackerState> {
  const today = todayLocal();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw?.trim()) return emptyToday();
    const j = JSON.parse(raw) as Partial<PrayerDailyTrackerState>;
    let streak = typeof j.streak === "number" ? Math.max(0, j.streak) : 0;
    let longest = typeof j.longest === "number" ? Math.max(0, j.longest) : 0;
    const lastComplete = typeof j.lastCompleteDate === "string" ? j.lastCompleteDate : "";
    const savedToday = typeof j.today === "string" ? j.today : "";
    const prayed =
      j.prayed && typeof j.prayed === "object"
        ? (j.prayed as Partial<Record<FardPrayerKey, boolean>>)
        : {};

    if (savedToday !== today) {
      if (lastComplete === savedToday && allFardDone(prayed)) {
        const yest = yesterdayOf(today);
        if (lastComplete === yest || streak === 0) {
          streak = lastComplete === yest ? streak + 1 : 1;
        } else {
          streak = 1;
        }
        longest = Math.max(longest, streak);
      } else if (lastComplete && lastComplete !== savedToday) {
        streak = 0;
      }
      const next: PrayerDailyTrackerState = {
        streak,
        longest,
        lastCompleteDate: lastComplete === savedToday && allFardDone(prayed) ? savedToday : lastComplete,
        today,
        prayed: {},
      };
      await writeState(next);
      return next;
    }

    return {
      streak,
      longest,
      lastCompleteDate: lastComplete,
      today,
      prayed,
    };
  } catch {
    return emptyToday();
  }
}

export async function toggleFardPrayer(key: FardPrayerKey): Promise<PrayerDailyTrackerState> {
  const cur = await loadPrayerDailyTracker();
  const prayed = { ...cur.prayed, [key]: !cur.prayed[key] };
  let { streak, longest, lastCompleteDate } = cur;

  if (allFardDone(prayed) && lastCompleteDate !== cur.today) {
    const yest = yesterdayOf(cur.today);
    if (lastCompleteDate === yest) {
      streak += 1;
    } else {
      streak = 1;
    }
    longest = Math.max(longest, streak);
    lastCompleteDate = cur.today;
  } else if (!allFardDone(prayed) && lastCompleteDate === cur.today) {
    lastCompleteDate = "";
  }

  const next: PrayerDailyTrackerState = {
    streak,
    longest,
    lastCompleteDate,
    today: cur.today,
    prayed,
  };
  await writeState(next);
  return next;
}

export function prayerTrackerProgress(prayed: Partial<Record<FardPrayerKey, boolean>>): {
  done: number;
  total: number;
} {
  return { done: countDone(prayed), total: FARD_PRAYER_KEYS.length };
}
