import React, { useMemo } from "react";
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
};

/** 12 тайл: 4×3 — contain, кесілмейді */
const COLS = 4;
const GAP = 1;
const H_PAD = 8;
/** 4 бағанға көшкенде тайлдар ұсақ көрінбесін. */
const TILE_IMAGE_WIDTH_RATIO = 0.98;

function chunkGridRows<T>(items: readonly T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}

export function DashboardHomeServicesGrid({ colors, isDark, onPress }: Props) {
  const locale = useAppLocale();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const gridRows = useMemo(() => chunkGridRows(getDashboardHomeServices(), COLS), [locale]);

  return (
    <View style={styles.wrap}>
      {gridRows.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={styles.row}>
          {row.map((item) => {
            const img = launcherTileImageStyle(item.key);
            const frameBg =
              img.tileBackground ?? (isDark ? colors.card : colors.bg);
            const webHref = Platform.OS === "web" ? dashboardHomeServiceWebPath(item.key) : undefined;

            return (
              <Pressable
                key={item.key}
                href={webHref}
                oyuBackdrop={false}
                onPress={() => onPress(item.key)}
                style={({ pressed }) => [
                  styles.tile,
                  pressed && styles.tilePressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.imageFrame, { backgroundColor: frameBg }]}>
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
                    accessibilityIgnoresInvertColors
                  />
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
}

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
