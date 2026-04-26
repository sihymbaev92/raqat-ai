import AsyncStorage from "@react-native-async-storage/async-storage";

export type LearningModuleProgress = {
  moduleId: "wudu" | "namaz";
  currentStepIndex: number;
  completedStepIds: string[];
  updatedAt: number;
};

export type Phase2AnswerStored = {
  pickedIndex: number;
  correct: boolean;
  at: number;
};

export type NamazLearningProgress = {
  modules: Record<"wudu" | "namaz", LearningModuleProgress>;
  updatedAt: number;
  /** Phase 2 микро-тест: сұрақ id → соңғы таңдалған жауап */
  phase2Answers?: Record<string, Phase2AnswerStored>;
};

const KEY = "namaz_learning_progress_v1";

const EMPTY: NamazLearningProgress = {
  modules: {
    wudu: { moduleId: "wudu", currentStepIndex: 0, completedStepIds: [], updatedAt: 0 },
    namaz: { moduleId: "namaz", currentStepIndex: 0, completedStepIds: [], updatedAt: 0 },
  },
  updatedAt: 0,
};

function sanitizeStepIndex(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function sanitizeCompleted(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return Array.from(new Set(arr.filter((x): x is string => typeof x === "string").slice(0, 512)));
}

function normalizeModule(moduleId: "wudu" | "namaz", raw: unknown): LearningModuleProgress {
  if (!raw || typeof raw !== "object") {
    return { moduleId, currentStepIndex: 0, completedStepIds: [], updatedAt: 0 };
  }
  const obj = raw as Partial<LearningModuleProgress>;
  return {
    moduleId,
    currentStepIndex: sanitizeStepIndex(obj.currentStepIndex),
    completedStepIds: sanitizeCompleted(obj.completedStepIds),
    updatedAt: typeof obj.updatedAt === "number" ? obj.updatedAt : 0,
  };
}

export async function loadNamazLearningProgress(): Promise<NamazLearningProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<NamazLearningProgress>;
    const modules = (parsed.modules ?? {}) as Partial<NamazLearningProgress["modules"]>;
    const phase2Raw = (parsed as { phase2Answers?: unknown }).phase2Answers;
    let phase2Answers: Record<string, Phase2AnswerStored> | undefined;
    if (phase2Raw && typeof phase2Raw === "object" && !Array.isArray(phase2Raw)) {
      const o: Record<string, Phase2AnswerStored> = {};
      for (const [k, v] of Object.entries(phase2Raw as Record<string, unknown>)) {
        if (typeof v !== "object" || !v) continue;
        const row = v as Partial<Phase2AnswerStored>;
        if (typeof row.pickedIndex !== "number") continue;
        o[k] = {
          pickedIndex: row.pickedIndex,
          correct: !!row.correct,
          at: typeof row.at === "number" ? row.at : 0,
        };
      }
      phase2Answers = Object.keys(o).length ? o : undefined;
    }
    return {
      modules: {
        wudu: normalizeModule("wudu", modules.wudu),
        namaz: normalizeModule("namaz", modules.namaz),
      },
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
      phase2Answers,
    };
  } catch {
    return EMPTY;
  }
}

async function saveProgress(next: NamazLearningProgress): Promise<NamazLearningProgress> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function saveNamazLearningStepProgress(input: {
  moduleId: "wudu" | "namaz";
  stepIndex: number;
  stepId: string;
}): Promise<NamazLearningProgress> {
  const prev = await loadNamazLearningProgress();
  const mod = prev.modules[input.moduleId];
  const completedStepIds = Array.from(new Set([input.stepId, ...mod.completedStepIds]));
  const now = Date.now();
  const next: NamazLearningProgress = {
    modules: {
      ...prev.modules,
      [input.moduleId]: {
        moduleId: input.moduleId,
        currentStepIndex: sanitizeStepIndex(input.stepIndex),
        completedStepIds,
        updatedAt: now,
      },
    },
    updatedAt: now,
    phase2Answers: prev.phase2Answers,
  };
  return saveProgress(next);
}

export async function resetNamazLearningModule(moduleId: "wudu" | "namaz"): Promise<NamazLearningProgress> {
  const prev = await loadNamazLearningProgress();
  const now = Date.now();
  const next: NamazLearningProgress = {
    modules: {
      ...prev.modules,
      [moduleId]: { moduleId, currentStepIndex: 0, completedStepIds: [], updatedAt: now },
    },
    updatedAt: now,
    phase2Answers: prev.phase2Answers,
  };
  return saveProgress(next);
}

export async function savePhase2QuizAnswer(input: {
  questionId: string;
  pickedIndex: number;
  correct: boolean;
}): Promise<NamazLearningProgress> {
  const prev = await loadNamazLearningProgress();
  const now = Date.now();
  const phase2Answers: Record<string, Phase2AnswerStored> = {
    ...(prev.phase2Answers ?? {}),
    [input.questionId]: {
      pickedIndex: input.pickedIndex,
      correct: input.correct,
      at: now,
    },
  };
  const next: NamazLearningProgress = {
    ...prev,
    phase2Answers,
    updatedAt: now,
  };
  return saveProgress(next);
}

export async function resetPhase2QuizAnswers(): Promise<NamazLearningProgress> {
  const prev = await loadNamazLearningProgress();
  const now = Date.now();
  const next: NamazLearningProgress = {
    ...prev,
    phase2Answers: undefined,
    updatedAt: now,
  };
  return saveProgress(next);
}

export function phase2QuizScore(answers: Record<string, Phase2AnswerStored> | undefined, totalQuestions: number) {
  if (!answers || totalQuestions <= 0) return { answered: 0, correct: 0, pct: 0 };
  let correct = 0;
  for (const row of Object.values(answers)) {
    if (row.correct) correct++;
  }
  const answered = Object.keys(answers).length;
  const pct = Math.round((correct / totalQuestions) * 100);
  return { answered, correct, pct };
}
