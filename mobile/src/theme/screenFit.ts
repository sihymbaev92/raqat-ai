import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { Platform, useWindowDimensions, type ViewStyle } from "react-native";

export type ScreenFitMetrics = {
  width: number;
  height: number;
  isCompactPhone: boolean;
  isWide: boolean;
  horizontalPadding: number;
  maxContentWidth: number;
  contentWidth: number;
  fontScale: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function resolveScreenFitMetrics(width: number, height: number): ScreenFitMetrics {
  const safeWidth = Math.max(1, Math.round(width || 1));
  const safeHeight = Math.max(1, Math.round(height || 1));
  const shortest = Math.min(safeWidth, safeHeight);
  const isCompactPhone = shortest < 360 || safeHeight < 640;
  const isWide = safeWidth >= 720;
  const horizontalPadding = isCompactPhone
    ? 10
    : safeWidth < 390
      ? 12
      : safeWidth < 600
        ? 16
        : safeWidth < 900
          ? 20
          : 24;
  const maxContentWidth = isWide ? 720 : safeWidth;
  const contentWidth = Math.max(1, Math.min(safeWidth, maxContentWidth) - horizontalPadding * 2);
  const fontScale = clamp(shortest / 390, 0.92, isWide ? 1.08 : 1);
  return {
    width: safeWidth,
    height: safeHeight,
    isCompactPhone,
    isWide,
    horizontalPadding,
    maxContentWidth,
    contentWidth,
    fontScale,
  };
}

export function screenFitContainerStyle(metrics: ScreenFitMetrics): ViewStyle {
  return {
    width: "100%",
    maxWidth: metrics.maxContentWidth,
    alignSelf: "center",
  };
}

export function screenFitScrollContentStyle(
  metrics: ScreenFitMetrics,
  opts: { top?: number; bottom?: number; includeHorizontalPadding?: boolean } = {}
): ViewStyle {
  return {
    ...screenFitContainerStyle(metrics),
    paddingHorizontal: opts.includeHorizontalPadding === false ? 0 : metrics.horizontalPadding,
    paddingTop: opts.top ?? 0,
    paddingBottom: opts.bottom ?? 0,
  };
}

const ScreenFitContext = createContext<ScreenFitMetrics | null>(null);

export function ScreenFitProvider({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const metrics = useMemo(() => resolveScreenFitMetrics(width, height), [height, width]);
  return React.createElement(ScreenFitContext.Provider, { value: metrics }, children);
}

export function useScreenFitMetrics(): ScreenFitMetrics {
  const provided = useContext(ScreenFitContext);
  const { width, height } = useWindowDimensions();
  const fallback = useMemo(() => resolveScreenFitMetrics(width, height), [height, width]);
  return provided ?? fallback;
}

export function webViewportClampStyle(metrics: ScreenFitMetrics): ViewStyle | null {
  if (Platform.OS !== "web") return null;
  return {
    width: "100%",
    minHeight: "100%",
    alignSelf: "center",
  };
}

