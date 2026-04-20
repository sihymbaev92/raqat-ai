import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "halal_recent_checks_v1";
const MAX_ITEMS = 8;
const MAX_INPUT = 8000;
const MAX_RESULT = 12000;

export type HalalCheckSource = "text" | "barcode" | "image";

export type HalalRecentItem = {
  id: string;
  savedAt: number;
  source: HalalCheckSource;
  /** AI-ға жіберілген мәтін (қайта қолдану үшін) */
  inputText: string;
  /** Қысқа көрініс тізім үшін */
  inputPreview: string;
  resultPreview: string;
};

function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function loadHalalRecent(): Promise<HalalRecentItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    return j.filter(
      (x): x is HalalRecentItem =>
        x != null &&
        typeof x === "object" &&
        typeof (x as HalalRecentItem).id === "string" &&
        typeof (x as HalalRecentItem).inputText === "string" &&
        typeof (x as HalalRecentItem).resultPreview === "string"
    );
  } catch {
    return [];
  }
}

export async function saveHalalRecentPush(
  source: HalalCheckSource,
  inputText: string,
  resultText: string
): Promise<void> {
  const input = clip(inputText, MAX_INPUT);
  const res = clip(resultText, MAX_RESULT);
  if (!input.trim() || !res.trim()) return;

  const prev = await loadHalalRecent();
  const item: HalalRecentItem = {
    id: newId(),
    savedAt: Date.now(),
    source,
    inputText: input,
    inputPreview: clip(input, 72),
    resultPreview: clip(res.replace(/\s+/g, " "), 100),
  };
  const next = [item, ...prev.filter((x) => x.inputText !== item.inputText)].slice(0, MAX_ITEMS);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
