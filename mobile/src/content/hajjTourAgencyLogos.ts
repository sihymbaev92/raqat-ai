import type { ImageSourcePropType } from "react-native";

/** Қажылық агенттіктері логотипі (id → локальды PNG). */
export const HAJJ_TOUR_AGENCY_LOGOS: Partial<Record<string, ImageSourcePropType>> = {
  niyet: require("../../assets/images/hajj/niyet-logo.png"),
};

export function getHajjTourAgencyLogo(agencyId: string): ImageSourcePropType | undefined {
  return HAJJ_TOUR_AGENCY_LOGOS[agencyId];
}
