import { Animated, Easing } from "react-native";

export type HatimPageTurnDirection = "forward" | "backward";

/** Қарапайым fade — қысқа. */
export const HATIM_PAGE_TURN_MS = 260;

type PageTurnPalette = {
  curlFace: string;
  curlEdge: string;
  curlBack: string;
  castShadow: string;
  ambientDim: string;
  foldShadow: readonly [string, string, string];
  edgeHighlight: readonly [string, string];
  spineGlow: readonly [string, string];
};

/** Тест/мұрагер үшін сақталған палитра (overlay енді қолданылмайды). */
export function hatimPageTurnPalette(pageFace: string, isDark: boolean): PageTurnPalette {
  if (isDark) {
    return {
      curlFace: "#2C2C2C",
      curlEdge: "#181818",
      curlBack: "#1A1A1A",
      castShadow: "rgba(0,0,0,0.4)",
      ambientDim: "rgba(0,0,0,0.28)",
      foldShadow: ["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0)"] as const,
      edgeHighlight: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0)"] as const,
      spineGlow: ["rgba(255,255,255,0.05)", "rgba(0,0,0,0)"] as const,
    };
  }
  return {
    curlFace: pageFace,
    curlEdge: "#E4D6C0",
    curlBack: "#F3EADF",
    castShadow: "rgba(0,0,0,0.12)",
    ambientDim: "rgba(0,0,0,0.06)",
    foldShadow: ["rgba(0,0,0,0)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0)"] as const,
    edgeHighlight: ["rgba(255,255,255,0.5)", "rgba(255,255,255,0)"] as const,
    spineGlow: ["rgba(255,248,235,0.3)", "rgba(255,248,235,0)"] as const,
  };
}

/** Overlay өшірілді — curl leaf жоқ (қарапайым fade ғана). */
export function HatimPageTurnOverlay(_props: {
  progress: Animated.Value;
  direction: HatimPageTurnDirection;
  pageWidth: number;
  pageFace: string;
  isDark: boolean;
  interactive?: boolean;
  grabYRatio?: number;
  shadowOnly?: boolean;
}): null {
  return null;
}

export function runHatimPageTurnAnimation(
  progress: Animated.Value,
  onDone: () => void,
  opts?: { fromProgress?: number }
): void {
  const from = Math.max(0, Math.min(1, opts?.fromProgress ?? 0));
  progress.stopAnimation();
  progress.setValue(from);
  const remaining = Math.max(90, Math.round(HATIM_PAGE_TURN_MS * (1 - from)));
  Animated.timing(progress, {
    toValue: 1,
    duration: remaining,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start(() => {
    onDone();
  });
}

export function springHatimPageTurnBack(progress: Animated.Value, onDone?: () => void): void {
  progress.stopAnimation();
  Animated.timing(progress, {
    toValue: 0,
    duration: 160,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start(() => {
    progress.setValue(0);
    onDone?.();
  });
}
