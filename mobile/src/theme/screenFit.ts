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
  /** Толық экранға сыйдыру коэффициенті (кішкентай экранда < 1). */
  layoutScale: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Дизайн базасы — осы енге қатысты авто масштаб. */
const DESIGN_WIDTH = 390;

export function resolveScreenFitMetrics(width: number, height: number): ScreenFitMetrics {
  const safeWidth = Math.max(1, Math.round(width || 1));
  const safeHeight = Math.max(1, Math.round(height || 1));
  const shortest = Math.min(safeWidth, safeHeight);
  const isCompactPhone = shortest < 360 || safeHeight < 640;
  const isWide = safeWidth >= 720;
  const horizontalPadding = isCompactPhone
    ? 8
    : safeWidth < 390
      ? 10
      : safeWidth < 600
        ? 14
        : safeWidth < 900
          ? 18
          : 24;
  // Телефонда толық ен — бос жиек қалдырмау.
  const maxContentWidth = isWide ? 720 : safeWidth;
  const contentWidth = Math.max(1, Math.min(safeWidth, maxContentWidth) - horizontalPadding * 2);
  const fontScale = clamp(shortest / DESIGN_WIDTH, 0.88, isWide ? 1.08 : 1);
  const layoutScale = clamp(safeWidth / DESIGN_WIDTH, 0.82, isWide ? 1 : 1.06);
  return {
    width: safeWidth,
    height: safeHeight,
    isCompactPhone,
    isWide,
    horizontalPadding,
    maxContentWidth,
    contentWidth,
    fontScale,
    layoutScale,
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

export function screenFitExplicitEdgeStyle(opts: { top?: number; bottom?: number } = {}): ViewStyle | null {
  const out: ViewStyle = {};
  if (opts.top != null) out.paddingTop = opts.top;
  if (opts.bottom != null) out.paddingBottom = opts.bottom;
  return Object.keys(out).length ? out : null;
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

