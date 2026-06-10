import { InteractionManager, Platform } from "react-native";

/**
 * InteractionManager.runAfterInteractions вебте Reanimated анимациялардан кейін
 * callback шақырмауы мүмкін — launcher/навигация «тұрып» қалады.
 */
export function runAfterInteractions(fn: () => void): { cancel: () => void } {
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
  return InteractionManager.runAfterInteractions(fn);
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
