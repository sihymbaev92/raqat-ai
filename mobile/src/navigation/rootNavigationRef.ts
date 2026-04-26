import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

/** Дауыспен басқару және басқа орталық навигация үшін */
export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();
