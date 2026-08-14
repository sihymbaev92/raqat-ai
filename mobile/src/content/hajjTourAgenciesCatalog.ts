/**
 * Қажылық / ұмыра тур агенттіктері — тізімді осы файлға қосыңыз.
 * (Nusuk орнына қолданбада жарнамалық блок көрсетіледі.)
 *
 * Мысал:
 * {
 *   id: "my-agency",
 *   name: "RAHAT Hajj & Umrah",
 *   tagline: "Ұмыра · қажылық · Мекке–Медина",
 *   city: "Алматы",
 *   phone: "+77001234567",
 *   whatsapp: "+77001234567",
 *   website: "https://example.kz",
 *   services: ["umrah", "hajj"],
 *   featured: true,
 * }
 */

export type HajjTourService = "umrah" | "hajj";

export type HajjTourAgency = {
  id: string;
  name: string;
  tagline: string;
  city?: string;
  phone?: string;
  /** E.164 (+7…) немесе wa.me сілтемесі */
  whatsapp?: string;
  website?: string;
  /** @handle немесе толық instagram.com сілтемесі — басу арқылы ашылады */
  instagram?: string;
  services?: HajjTourService[];
  /** Тізімнің үстінде көрсету */
  featured?: boolean;
  /** Логотипті ірі көрсету (мысалы: Ниет) */
  logoLarge?: boolean;
};

/** Тіркелген қажылық тур агенттіктері — жаңа жол қосыңыз. */
export const HAJJ_TOUR_AGENCIES: HajjTourAgency[] = [
  {
    id: "niyet",
    name: "Ниет",
    tagline: "Niyet еткен жүрекке жол ашамыз · ұмыра · қажылық · Мекке–Медина",
    city: "Алматы · Шымкент",
    phone: "+77784477666",
    whatsapp: "+77784477666",
    instagram: "niyet_hajj_umrah_",
    services: ["umrah", "hajj"],
    featured: true,
    logoLarge: true,
  },
];

export function getHajjTourAgencies(): HajjTourAgency[] {
  return [...HAJJ_TOUR_AGENCIES].sort((a, b) => {
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name, "kk");
  });
}
