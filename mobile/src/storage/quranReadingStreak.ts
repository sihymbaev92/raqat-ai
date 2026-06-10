import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "quran_reading_streak_v1";

export type QuranReadingStreak = {
  current: number;
  longest: number;
  /** YYYY-MM-DD — соңғы оқу күні (жергілікті) */
  lastDate: string;
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

const emptyStreak = (): QuranReadingStreak => ({
  current: 0,
  longest: 0,
  lastDate: "",
});

export async function loadQuranReadingStreak(): Promise<QuranReadingStreak> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw?.trim()) return emptyStreak();
    const j = JSON.parse(raw) as Partial<QuranReadingStreak>;
    return {
      current: typeof j.current === "number" ? Math.max(0, j.current) : 0,
      longest: typeof j.longest === "number" ? Math.max(0, j.longest) : 0,
      lastDate: typeof j.lastDate === "string" ? j.lastDate : "",
    };
  } catch {
    return emptyStreak();
  }
}

/** Соңғы оқу сақталғанда шақырылады — күн сайын бір рет серияны жаңартады. */
export async function recordQuranReadingDay(): Promise<QuranReadingStreak> {
  const today = todayLocal();
  const prev = await loadQuranReadingStreak();
  if (prev.lastDate === today) return prev;

  let current = 1;
  if (prev.lastDate && yesterdayOf(today) === prev.lastDate) {
    current = prev.current + 1;
  }
  const longest = Math.max(prev.longest, current);
  const next: QuranReadingStreak = { current, longest, lastDate: today };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
