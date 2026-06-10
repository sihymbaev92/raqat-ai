/** Launcher «Қызметтер» swipe порогтары — тесттеуге шығарылған. */
export const LAUNCHER_SWIPE_DIST_PX = 32;
export const LAUNCHER_SWIPE_VEL = 260;
/** Жабық күй: FAB үстінен swipe-up қабылдау (px). */
export const LAUNCHER_SWIPE_OPEN_CAPTURE_ABOVE_PX = 52;

export function shouldOpenLauncherFromSwipe(translationY: number, velocityY: number): boolean {
  return translationY < -LAUNCHER_SWIPE_DIST_PX || velocityY < -LAUNCHER_SWIPE_VEL;
}

export function shouldCloseLauncherFromSwipe(translationY: number, velocityY: number): boolean {
  return translationY > LAUNCHER_SWIPE_DIST_PX || velocityY > LAUNCHER_SWIPE_VEL;
}
