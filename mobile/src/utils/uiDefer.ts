import { InteractionManager } from "react-native";

/**
 * Навигация/анимация аяқталғаннан кейін ауыр JS жұмысын бастау —
 * қолданба «қатып қалған» әсерін азайтады.
 */
export function runWhenHeavyWorkAllowed(): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  });
}
