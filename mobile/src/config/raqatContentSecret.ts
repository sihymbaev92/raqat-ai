/**
 * Серверде `RAQAT_CONTENT_READ_SECRET` болса GET /quran|/hadith|/metadata
 * үшін `X-Raqat-Content-Secret` қажет.
 *
 * Release APK-қа құпия енгізілмейді (reverse-engineer). Продта контент
 * офлайн пакет / JWT арқылы; құпия тек `__DEV__` жинақта оқылады.
 */
export function getRaqatContentReadSecret(): string | undefined {
  if (typeof __DEV__ === "undefined" || !__DEV__) {
    return undefined;
  }
  const raw =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_CONTENT_SECRET
      ? String(process.env.EXPO_PUBLIC_RAQAT_CONTENT_SECRET)
      : "";
  const t = raw.trim();
  return t.length > 0 ? t : undefined;
}
