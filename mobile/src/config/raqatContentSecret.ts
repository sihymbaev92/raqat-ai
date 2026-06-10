/**
 * Серверде `RAQAT_CONTENT_READ_SECRET` орнатылғанда GET /quran|/hadith|/metadata
 * үшін `X-Raqat-Content-Secret` қажет. Мән жинақтау кезінде: `EXPO_PUBLIC_RAQAT_CONTENT_SECRET`
 * (`mobile/.env`) — сервердегі құпиямен бірдей болуы керек.
 */
export function getRaqatContentReadSecret(): string | undefined {
  const raw =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_CONTENT_SECRET
      ? String(process.env.EXPO_PUBLIC_RAQAT_CONTENT_SECRET)
      : "";
  const t = raw.trim();
  return t.length > 0 ? t : undefined;
}
