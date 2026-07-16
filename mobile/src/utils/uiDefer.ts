import { InteractionManager, Platform } from "react-native";

/**
 * InteractionManager.runAfterInteractions вебте Reanimated анимациялардан кейін
 * callback шақырмауы мүмкін — launcher/навигация «тұрып» қалады.
 */
export function runAfterInteractions(fn: () => void, maxWaitMs = 800): { cancel: () => void } {
  if (Platform.OS === "web") {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) fn();
      });
    });
    return {
      cancel: () => {
        cancelled = true;
        cancelAnimationFrame(id);
      },
    };
  }
  let done = false;
  let cancelled = false;
  const run = () => {
    if (done || cancelled) return;
    done = true;
    fn();
  };
  const handle = InteractionManager.runAfterInteractions(run);
  const timer = setTimeout(run, Math.max(0, maxWaitMs));
  return {
    cancel: () => {
      cancelled = true;
      clearTimeout(timer);
      handle.cancel?.();
    },
  };
}

/**
 * Навигация/анимация аяқталғаннан кейін ауыр JS жұмысын бастау —
 * қолданба «қатып қалған» әсерін азайтады.
 */
export function runWhenHeavyWorkAllowed(): Promise<void> {
  return new Promise((resolve) => {
    runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  });
}
