import React, { memo, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import type { ThemeColors } from "../../theme/colors";
import { uiText } from "../../theme/typography";
import {
  dashboardHomeServiceWebPath,
  getDashboardHomeServices,
  type DashboardHomeServiceKey,
} from "../../config/dashboardHomeServices";
import { launcherTileImageStyle } from "../../config/dashboardLauncherTileImage";
import { useAppLocale } from "../../i18n/runtime";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  onPress: (key: DashboardHomeServiceKey) => void;
  onPressIn?: (key: DashboardHomeServiceKey) => void;
};

/** Үлкен кісілерге оңай басылатын ірі тайлдар: 3 баған. */
const COLS = 3;
const GAP = 6;
const H_PAD = 8;
/** 3 бағанда растр тайлды кадрға толық жақын ұстаймыз. */
const TILE_IMAGE_WIDTH_RATIO = 0.9;
const INITIAL_IMAGE_ROWS = 0;
const ROW_IMAGE_REVEAL_START_DELAY_MS = 180;
const ROW_IMAGE_REVEAL_DELAY_MS = 140;
const ROW_IMAGE_REVEAL_BATCH_ROWS = 2;

function chunkGridRows<T>(items: readonly T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}

export const DashboardHomeServicesGrid = memo(function DashboardHomeServicesGrid({
  colors,
  isDark,
  onPress,
  onPressIn,
}: Props) {
  const locale = useAppLocale();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const gridRows = useMemo(() => chunkGridRows(getDashboardHomeServices(), COLS), [locale]);
  const [visibleImageRows, setVisibleImageRows] = useState(() => Math.min(INITIAL_IMAGE_ROWS, gridRows.length));

  useEffect(() => {
    setVisibleImageRows(Math.min(INITIAL_IMAGE_ROWS, gridRows.length));
    if (gridRows.length <= INITIAL_IMAGE_ROWS) return undefined;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (
      let rowIdx = INITIAL_IMAGE_ROWS;
      rowIdx < gridRows.length;
      rowIdx += ROW_IMAGE_REVEAL_BATCH_ROWS
    ) {
      const timer = setTimeout(() => {
        if (!cancelled) {
          setVisibleImageRows((prev) =>
            Math.max(prev, Math.min(gridRows.length, rowIdx + ROW_IMAGE_REVEAL_BATCH_ROWS))
          );
        }
      }, ROW_IMAGE_REVEAL_START_DELAY_MS + Math.floor((rowIdx - INITIAL_IMAGE_ROWS) / ROW_IMAGE_REVEAL_BATCH_ROWS) * ROW_IMAGE_REVEAL_DELAY_MS);
      timers.push(timer);
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [gridRows.length]);

  return (
    <View style={styles.wrap}>
      {gridRows.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={styles.row}>
          {row.map((item) => {
            const img = launcherTileImageStyle(item.key);
            const frameBg =
              img.tileBackground ?? (isDark ? colors.card : colors.bg);
            const webHref = Platform.OS === "web" ? dashboardHomeServiceWebPath(item.key) : undefined;
            const shouldRenderImage = rowIdx < visibleImageRows;

            return (
              <Pressable
                key={item.key}
                href={webHref}
                oyuBackdrop={false}
                onPressIn={() => onPressIn?.(item.key)}
                onPress={() => onPress(item.key)}
                style={({ pressed }) => [
                  styles.tile,
                  pressed && styles.tilePressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.imageFrame, { backgroundColor: frameBg }]}>
                  {shouldRenderImage ? (
                    <RasterImage
                      source={item.image}
                      style={[
                        styles.image,
                        {
                          opacity: img.opacity ?? 1,
                          transform: [
                            { scale: img.scale ?? 1.05 },
                            ...(img.translateX != null || img.translateY != null
                              ? [
                                  { translateX: img.translateX ?? 0 },
                                  { translateY: img.translateY ?? 0 },
                                ]
                              : []),
                          ],
                        },
                      ]}
                      resizeMode={img.resizeMode ?? "contain"}
                      resizeMethod={Platform.OS === "android" ? "resize" : undefined}
                      resizeMultiplier={Platform.OS === "android" ? 0.72 : undefined}
                      fadeDuration={0}
                      accessibilityIgnoresInvertColors
                    />
                  ) : (
                    <View pointerEvents="none" style={styles.imagePlaceholder} />
                  )}
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
});

function makeStyles(colors: ThemeColors, _isDark: boolean) {
  return StyleSheet.create({
    wrap: {
      marginTop: 2,
      marginBottom: 0,
      paddingHorizontal: H_PAD,
      gap: GAP,
    },
    row: {
      flexDirection: "row",
      gap: GAP,
    },
    tile: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      padding: 0,
    },
    tilePressed: {
      opacity: 0.88,
      transform: [{ scale: 0.97 }],
    },
    imageFrame: {
      width: `${TILE_IMAGE_WIDTH_RATIO * 100}%`,
      aspectRatio: 1,
      borderRadius: 12,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    imagePlaceholder: {
      width: "72%",
      height: "72%",
      borderRadius: 16,
      backgroundColor: colors.border,
      opacity: 0.18,
    },
    label: {
      ...uiText("xs", "bold"),
      color: colors.text,
      textAlign: "center",
      marginTop: 2,
      paddingHorizontal: 0,
      width: `${TILE_IMAGE_WIDTH_RATIO * 100}%`,
    },
  });
}
