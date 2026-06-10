/**
 * Мұсаф бет нөмірі: глобалды аят (1..6236) → 1..604 (Хафс, Quran.com / KFGQPC PageList үлгісі).
 * Дерек: Хафс 604 PageList — қолданбадағы `quran-uthmani-full.json` `page` өрісімен сәйкес.
 *
 * Мадина (King Fahd) және көп түрік 604 басылымдары осы Хафс кестесіне сәйкес келеді; қолданбада бөлек
 * «түрік бет картасы» жоқ — бет нөмірі бір ғана есептеу жолымен шығады.
 */
import { hafsPageFromGlobalAyahOneBased } from "./quranHafsPageFromGlobalAyah";

export function mushafDisplayPageFromGlobalAyahOneBased(globalOneBased: number): number {
  const g = Math.max(1, Math.min(6236, Math.floor(globalOneBased)));
  return hafsPageFromGlobalAyahOneBased(g);
}
