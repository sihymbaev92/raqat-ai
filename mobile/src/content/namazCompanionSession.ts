import type { ImageSourcePropType } from "react-native";
import { FIVE_PRAYER_RAKAT_ROWS, NAMAZ_POSE_VISUAL_STEPS } from "./namazPrayerGuideContent";

export type NamazCompanionSalatKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type NamazCompanionStep = {
  id: string;
  salatKey: NamazCompanionSalatKey;
  rakat: number;
  totalRakats: number;
  /** Қадам ішіндегі қысқа белгі: тәкбір / қиям / рукуғ / сәжде / отырыс */
  phaseKey: "takbir" | "qiyam" | "ruku" | "sajdah" | "sitting";
  title: string;
  desc: string;
  actions: string[];
  hints?: string[];
  image: ImageSourcePropType;
  progressLabel: string;
};

const FARD_RAKAT_COUNT: Record<NamazCompanionSalatKey, number> = {
  fajr: 2,
  dhuhr: 4,
  asr: 4,
  maghrib: 3,
  isha: 4,
};

const POSE = {
  takbir: NAMAZ_POSE_VISUAL_STEPS[0],
  qiyam: NAMAZ_POSE_VISUAL_STEPS[1],
  ruku: NAMAZ_POSE_VISUAL_STEPS[2],
  sajdah: NAMAZ_POSE_VISUAL_STEPS[3],
  sitting: NAMAZ_POSE_VISUAL_STEPS[4],
} as const;

export function namazCompanionFardRakatCount(salatKey: NamazCompanionSalatKey): number {
  return FARD_RAKAT_COUNT[salatKey];
}

export function namazCompanionSalatOptions(): Array<{
  key: NamazCompanionSalatKey;
  title: string;
  rakatCount: number;
}> {
  return (Object.keys(FARD_RAKAT_COUNT) as NamazCompanionSalatKey[]).map((key) => {
    const row = FIVE_PRAYER_RAKAT_ROWS.find((r) => r.key === key);
    return {
      key,
      title: row?.title ?? key,
      rakatCount: FARD_RAKAT_COUNT[key],
    };
  });
}

function pushPose(
  steps: NamazCompanionStep[],
  opts: {
    salatKey: NamazCompanionSalatKey;
    rakat: number;
    totalRakats: number;
    phaseKey: NamazCompanionStep["phaseKey"];
    pose: (typeof POSE)[keyof typeof POSE];
    titleOverride?: string;
    descOverride?: string;
  }
): void {
  const { salatKey, rakat, totalRakats, phaseKey, pose } = opts;
  const n = steps.length + 1;
  steps.push({
    id: `${salatKey}-r${rakat}-${phaseKey}-${n}`,
    salatKey,
    rakat,
    totalRakats,
    phaseKey,
    title: opts.titleOverride ?? pose.title,
    desc: opts.descOverride ?? pose.desc,
    actions: pose.actions,
    hints: pose.hints,
    image: pose.image,
    progressLabel: `${rakat}/${totalRakats} рәкәт · ${opts.titleOverride ?? pose.title}`,
  });
}

/**
 * Парыз намазды қадам-қадам жетектеу тізбегі (Ханафи оқу схемасы).
 * Оқу материалы — тірі фиқһ үкімі емес.
 */
export function buildNamazCompanionSteps(salatKey: NamazCompanionSalatKey): NamazCompanionStep[] {
  const totalRakats = FARD_RAKAT_COUNT[salatKey];
  const steps: NamazCompanionStep[] = [];

  for (let rakat = 1; rakat <= totalRakats; rakat += 1) {
    if (rakat === 1) {
      pushPose(steps, { salatKey, rakat, totalRakats, phaseKey: "takbir", pose: POSE.takbir });
    }
    pushPose(steps, { salatKey, rakat, totalRakats, phaseKey: "qiyam", pose: POSE.qiyam });
    pushPose(steps, { salatKey, rakat, totalRakats, phaseKey: "ruku", pose: POSE.ruku });
    pushPose(steps, { salatKey, rakat, totalRakats, phaseKey: "sajdah", pose: POSE.sajdah });

    const isLast = rakat === totalRakats;
    const needsMiddleSitting =
      !isLast && ((totalRakats === 3 && rakat === 2) || (totalRakats === 4 && rakat === 2));

    if (needsMiddleSitting) {
      pushPose(steps, {
        salatKey,
        rakat,
        totalRakats,
        phaseKey: "sitting",
        pose: POSE.sitting,
        titleOverride: "Аралық отырыс",
        descOverride: "Екінші рәкәттен кейін отырып Әт-тахият оқылады, содан тұрып келесі рәкәтке өтесіз.",
      });
    }

    if (isLast) {
      pushPose(steps, {
        salatKey,
        rakat,
        totalRakats,
        phaseKey: "sitting",
        pose: POSE.sitting,
        titleOverride: "Соңғы отырыс және сәлем",
      });
    }
  }

  return steps;
}

export function namazCompanionStepProgress(stepIndex: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.min(1, Math.max(0, (stepIndex + 1) / totalSteps));
}
