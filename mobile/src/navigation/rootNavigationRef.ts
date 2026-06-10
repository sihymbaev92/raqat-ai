import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

/** Орталық навигация (deeplink / widget / сервистер) үшін */
export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();
