/** Өнім ашықтығы — КНБ/ҚМДБ алдында «причина» қалдырмау үшін тұрақты саясат. */

/** Қоғамдық дұға жариялау — оқу, «Әмин» және жаңа мәтін жіберу қосулы. */
export const COMMUNITY_DUA_PUBLIC_POSTING_ENABLED = true;

/** Құпиялылық беті (веб). */
export const PRIVACY_POLICY_URL = "https://rahatomir.com/privacy/";

/** Қолданба — тәуелсіз өнім; ҚМДБ ресми қолданбасы емес. */
export const APP_IS_OFFICIAL_KMDB_APP = false;

export const TRANSPARENCY_THIRD_PARTIES_KK = [
  "api.rahatomir.com — аккаунт, синк, қателер (IP хэш), қосымша оқиғалар",
  "Muftyat.kz / Fatua.kz — ресми мақала/пәтуа индексі (үзінді + сілтеме)",
  "api.muftyat.kz — ҚР намаз кестесі (басым)",
  "api.aladhan.com — намаз уақыты резерві (ISNA method 2, Hanafi asr)",
  "cdn.islamic.network / alquran.cloud / Quran.com CDN — Құран мәтін/аудио/тәжуид",
  "rahatomir.com/assets/quran/audio — қырғыз/өзбек аударма аудиосы (RAQAT CDN)",
  "Google / Apple — OAuth кіру (токен тек сіздің серверіңізге)",
  "live.net.sa — Қағба тікелей эфир (HLS)",
] as const;
