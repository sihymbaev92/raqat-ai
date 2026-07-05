import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { Platform, useWindowDimensions } from "react-native";
import type { EdgeInsets, Metrics } from "react-native-safe-area-context";
import { modalSafeAreaInsets } from "./modalSafeArea";

export const ZERO_EDGE_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Edge-to-edge Android: жүйелік сағат/батарея аймағына fallback. */
export function deviceSafeAreaInsets(insets: EdgeInsets): EdgeInsets {
  return modalSafeAreaInsets(insets);
}

export function appBottomSafeInset(insets: EdgeInsets): number {
  const resolved = deviceSafeAreaInsets(insets);
  return Platform.OS === "android" ? Math.max(resolved.bottom, 12) : resolved.bottom;
}

export function zeroedSafeAreaMetrics(width: number, height: number): Metrics {
  return {
    insets: ZERO_EDGE_INSETS,
    frame: { x: 0, y: 0, width: Math.max(1, width), height: Math.max(1, height) },
  };
}

const DeviceSafeAreaInsetsContext = createContext<EdgeInsets>(ZERO_EDGE_INSETS);

export function DeviceSafeAreaInsetsProvider({
  value,
  children,
}: {
  value: EdgeInsets;
  children: ReactNode;
}) {
  return (
    <DeviceSafeAreaInsetsContext.Provider value={value}>{children}</DeviceSafeAreaInsetsContext.Provider>
  );
}

/** Толық құрылғы safe-area (модалдар және толық экран қабаттар үшін). */
export function useDeviceSafeAreaInsets(): EdgeInsets {
  return useContext(DeviceSafeAreaInsetsContext);
}

export function useModalSafeAreaInsets(): EdgeInsets {
  return modalSafeAreaInsets(useDeviceSafeAreaInsets());
}

export function useZeroedSafeAreaMetrics(): Metrics {
  const { width, height } = useWindowDimensions();
  return useMemo(() => zeroedSafeAreaMetrics(width, height), [height, width]);
}
