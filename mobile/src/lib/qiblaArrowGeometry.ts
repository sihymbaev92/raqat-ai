/**
 * Құбыла иінінің бұру геометриясы.
 * RN: оңға бұрылу = сағат тілі; 0° = экранның жоғары жағы (+Y төменге қарағанда 180°).
 */

/** Векторлық иін: ұш кадрда төмен (+Y) — spin = rotateDeg + NEEDLE_SPIN_OFFSET. */
export const QIBLA_NEEDLE_SPIN_OFFSET_DEG = 180;

/**
 * PNG `qibla-arrow-ornament.png`: алтын ұш жоғарыға (~35° экран азимуты, asset өлшемінен).
 * Суретті ауыстырсаңыз: asset түбірінен өлшеңіз (centroid → ұш).
 */
export const QIBLA_ORNAMENT_ASSET_TIP_DEG = 35;

/**
 * Ескі қос бұрылыс (ішкі Image align) — енді `qiblaOrnamentSpinDeg` қолданылады.
 * @deprecated сыртқы spin + ішкі align орнына бір `qiblaOrnamentSpinDeg`.
 */
export const QIBLA_ORNAMENT_IMAGE_ALIGN_DEG =
  QIBLA_NEEDLE_SPIN_OFFSET_DEG - QIBLA_ORNAMENT_ASSET_TIP_DEG;

/** Оюлы PNG: бір бұрылыс — ұш азимуты = rotateDeg (0° = жоғары, сағат тілі). */
export function qiblaOrnamentSpinDeg(rotateDeg: number): number {
  return rotateDeg - QIBLA_ORNAMENT_ASSET_TIP_DEG;
}

/** Экранда ұштың көрінетін азимуты (0° = жоғары, сағат тілі). */
export function qiblaNeedleTipScreenDeg(rotateDeg: number): number {
  return ((rotateDeg % 360) + 360) % 360;
}

/** Векторлық иін контейнері (ұш кадрда төмен, +180° құбылаға). */
export function qiblaNeedleSpinDeg(rotateDeg: number): number {
  return rotateDeg + QIBLA_NEEDLE_SPIN_OFFSET_DEG;
}
