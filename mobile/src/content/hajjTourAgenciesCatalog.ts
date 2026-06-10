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
  instagram?: string;
  services?: HajjTourService[];
  /** Тізімнің үстінде көрсету */
  featured?: boolean;
};

/** Тіркелген қажылық тур агенттіктері — жаңа жол қосыңыз. */
export const HAJJ_TOUR_AGENCIES: HajjTourAgency[] = [];

export function getHajjTourAgencies(): HajjTourAgency[] {
  return [...HAJJ_TOUR_AGENCIES].sort((a, b) => {
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name, "kk");
  });
}
