import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "seerah_progress_v1";

export type SeerahProgress = {
  viewedLessons: number[];
  lastLesson: number | null;
  updatedAt: number;
};

const EMPTY: SeerahProgress = { viewedLessons: [], lastLesson: null, updatedAt: 0 };

export async function loadSeerahProgress(): Promise<SeerahProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const j = JSON.parse(raw) as Partial<SeerahProgress>;
    const viewed = Array.isArray(j.viewedLessons)
      ? j.viewedLessons.filter((n): n is number => Number.isInteger(n) && n > 0).slice(0, 256)
      : [];
    return {
      viewedLessons: viewed,
      lastLesson: Number.isInteger(j.lastLesson) ? (j.lastLesson as number) : null,
      updatedAt: typeof j.updatedAt === "number" ? j.updatedAt : 0,
    };
  } catch {
    return EMPTY;
  }
}

export async function saveSeerahLessonViewed(lesson: number): Promise<SeerahProgress> {
  const prev = await loadSeerahProgress();
  const viewed = Array.from(new Set([lesson, ...prev.viewedLessons])).sort((a, b) => a - b);
  const next: SeerahProgress = {
    viewedLessons: viewed,
    lastLesson: lesson,
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
