/**
 * Қауіпсіздік: AI secret клиентте қолданылмайды (EXPO_PUBLIC арқылы таратылмайды).
 * Толық AI үшін тек server-side auth (JWT scope ai) қолданылады.
 */
export function getRaqatAiSecret(): string {
  return "";
}
