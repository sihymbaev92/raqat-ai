import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Platform, BackHandler, useWindowDimensions, Text, type ViewStyle } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import { kk } from "../../i18n/kk";
import { useAppLocale } from "../../i18n/runtime";
import { BRAND_FONT_FACE } from "../../fonts/brandFont";
import { menuIconAssets } from "../../theme/menuIconAssets";
import {
  type DashboardRadialItemDef,
  type DashboardRadialItemKey,
} from "../../config/dashboardRadialItems";
import {
  chunkLauncherGridRows,
  computeLauncherHubMetrics,
  LAUNCHER_FAB_DOWN_OFFSET_PX,
  LAUNCHER_FAB_TRANSLATE_Y_PX,
  type LauncherHubMetrics,
} from "./launcherHubMetrics";
import { launcherTileImageStyle, launcherTileInsetPx } from "../../config/dashboardLauncherTileImage";
import {
  LAUNCHER_SWIPE_OPEN_CAPTURE_ABOVE_PX,
  shouldCloseLauncherFromSwipe,
  shouldOpenLauncherFromSwipe,
} from "./launcherSwipeGesture";

const FAB_RING_COLOR = "rgba(232, 200, 106, 0.55)";
const FAB_RING_OPEN_COLOR = "rgba(232, 200, 106, 0.78)";
const SPRING = { damping: 15, stiffness: 170, mass: 0.85 };
const GRID_UNMOUNT_AFTER_CLOSE_MS = 320;

function tileBorderColor(isDark: boolean): string {
  return isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.14)";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: DashboardRadialItemDef[];
  isDark: boolean;
  onItemPress: (key: DashboardRadialItemKey) => void;
  /** Launcher ашық: ең үстінде «келесі намаз» жолағы. */
  prayerHeader?: React.ReactNode;
};

function GridAppTile({
  item,
  size,
  corner,
  isDark,
  fill,
  onPress,
  styles,
}: {
  item: DashboardRadialItemDef;
  size: number;
  corner: number;
  isDark: boolean;
  fill?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const img = launcherTileImageStyle(item.key);
  const inset = launcherTileInsetPx(size, img.paddingRatio);
  const resizeMode = img.resizeMode ?? "contain";

  const tileStyle: ViewStyle[] = [
    styles.gridTile,
    {
      borderRadius: corner,
      backgroundColor: img.tileBackground ?? item.color,
      borderColor: tileBorderColor(isDark),
      width: size,
      height: size,
      alignSelf: "center",
    },
  ];

  return (
    <Pressable
      onPress={onPress}
      oyuBackdrop={false}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={({ pressed }) => [
        styles.gridCell,
        fill && styles.gridCellFill,
        pressed && styles.pressDown,
      ]}
    >
      <View style={tileStyle}>
        <View style={[styles.tileImageFrame, { padding: inset }]}>
          <RasterImage
            source={item.image}
            style={[
              styles.tileImageFill,
              {
                opacity: img.opacity ?? 1,
                transform: [
                  { scale: img.scale ?? 1 },
                  ...(img.translateX != null || img.translateY != null
                    ? [
                        { translateX: img.translateX ?? 0 },
                        { translateY: img.translateY ?? 0 },
                      ]
                    : []),
                ],
              },
            ]}
            resizeMode={resizeMode}
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>
    </Pressable>
  );
}

function AnimatedGridRow({
  rowIdx,
  rowCount,
  progress,
  metrics,
  fillRow,
  children,
}: {
  rowIdx: number;
  rowCount: number;
  progress: SharedValue<number>;
  metrics: LauncherHubMetrics;
  fillRow?: boolean;
  children: React.ReactNode;
}) {
  const rowStep = metrics.gridItemSize + metrics.gridGap;
  const startOffset = (rowCount - 1 - rowIdx) * rowStep + metrics.dockRowHeight * 0.35;

  const rowStyle = useAnimatedStyle(() => {
    const rowDelay = rowIdx * 0.07;
    const p = interpolate(progress.value, [rowDelay, rowDelay + 0.72], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: interpolate(p, [0, 0.25, 1], [0, 0.85, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(p, [0, 1], [startOffset, 0], Extrapolation.CLAMP),
        },
        {
          scale: interpolate(p, [0, 1], [0.82, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <Animated.View style={[fillRow && { flex: 1, minHeight: 0 }, rowStyle]}>{children}</Animated.View>
  );
}

export function DashboardLauncherHub({
  open,
  onOpenChange,
  items,
  isDark,
  onItemPress,
  prayerHeader,
}: Props) {
  useAppLocale();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const metrics = useMemo(
    () =>
      computeLauncherHubMetrics(windowWidth, {
        windowHeight,
        safeBottom: insets.bottom,
        safeTop: insets.top,
        headerHeight,
        launcherOpen: open,
      }),
    [windowWidth, windowHeight, insets.bottom, insets.top, headerHeight, open]
  );
  const styles = useMemo(() => makeStyles(isDark, metrics, open), [isDark, metrics, open]);
  const progress = useSharedValue(open ? 1 : 0);
  const openRef = useRef(open);
  const rows = useMemo(() => chunkLauncherGridRows(items), [items]);
  const closedHeight = metrics.closedMinHeight;
  const [gridLayout, setGridLayout] = useState({ width: 0, height: 0 });
  const [gridMounted, setGridMounted] = useState(open);

  const activeTileSize = useMemo(() => {
    if (!open) return metrics.gridItemSize;
    if (gridLayout.width <= 0 || gridLayout.height <= 0) return metrics.gridItemSize;
    const rowCount = rows.length;
    const colCount = 3;
    const gap = metrics.gridGap;
    const cellW = (gridLayout.width - gap * (colCount - 1)) / colCount;
    const cellH = (gridLayout.height - gap * (rowCount - 1)) / rowCount;
    return Math.max(64, Math.floor(Math.min(cellW, cellH)));
  }, [open, gridLayout, metrics.gridItemSize, metrics.gridGap, rows.length]);

  const activeCorner = Math.round(activeTileSize * 0.2);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) setGridLayout({ width: 0, height: 0 });
  }, [open]);

  useEffect(() => {
    if (open) {
      setGridMounted(true);
      return undefined;
    }
    const id = setTimeout(() => setGridMounted(false), GRID_UNMOUNT_AFTER_CLOSE_MS);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    progress.value = withSpring(open ? 1 : 0, SPRING);
  }, [open, progress]);

  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(
          next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
        ).catch(() => {});
      }
    },
    [onOpenChange]
  );

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const close = useCallback(() => {
    if (open) setOpen(false);
  }, [open, setOpen]);

  const panOpenGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(-10)
        .failOffsetX([-32, 32])
        .onEnd((e) => {
          if (openRef.current) return;
          if (shouldOpenLauncherFromSwipe(e.translationY, e.velocityY)) {
            runOnJS(setOpen)(true);
          }
        }),
    [setOpen]
  );

  const panCloseGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(10)
        .failOffsetX([-32, 32])
        .onEnd((e) => {
          if (!openRef.current) return;
          if (shouldCloseLauncherFromSwipe(e.translationY, e.velocityY)) {
            runOnJS(setOpen)(false);
          }
        }),
    [setOpen]
  );

  useEffect(() => {
    if (Platform.OS !== "android" || !open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [open, close]);

  const gridWrapStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 1], [0, 0.9, 1], Extrapolation.CLAMP),
  }));

  const fabPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: LAUNCHER_FAB_TRANSLATE_Y_PX }],
  }));

  const fabTrailIconSize = Math.min(22, Math.max(18, metrics.fabPillHeight - 22));

  const plusIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
  }));

  const runLauncherAction = useCallback(
    (fn: () => void) => {
      fn();
      if (!open) return;
      requestAnimationFrame(() => setOpen(false));
    },
    [open, setOpen]
  );

  const handleGridPress = useCallback(
    (key: DashboardRadialItemKey) => {
      runLauncherAction(() => onItemPress(key));
    },
    [runLauncherAction, onItemPress]
  );

  const fabCluster = (
    <Animated.View
      style={[
        styles.fabCluster,
        fabPillStyle,
        {
          width: metrics.fabPillWidth,
          height: metrics.fabPillHeight,
        },
      ]}
    >
      <Pressable
        onPress={toggle}
        oyuBackdrop={false}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? kk.dashboard.radialLauncherCloseA11y : kk.dashboard.radialLauncherOpenA11y}
        accessibilityHint={
          open ? kk.dashboard.radialLauncherCloseHint : kk.dashboard.radialLauncherOpenHint
        }
        style={({ pressed }) => [
          styles.fabPillPress,
          {
            width: metrics.fabPillWidth,
            height: metrics.fabPillHeight,
            borderRadius: metrics.fabPillRadius,
            borderColor: open ? FAB_RING_OPEN_COLOR : FAB_RING_COLOR,
            backgroundColor: isDark ? "rgba(18, 24, 32, 0.96)" : "rgba(255, 255, 255, 0.98)",
          },
          pressed && styles.pressDown,
        ]}
      >
        <View style={styles.fabPillRow}>
          <Animated.View style={[styles.fabPillLogoSlot, plusIconStyle]}>
            <RasterImage
              source={menuIconAssets.dashboardFabLogo}
              style={{
                width: metrics.fabPillLogoSize,
                height: metrics.fabPillLogoSize,
                borderRadius: Math.round(metrics.fabPillLogoSize * 0.22),
              }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
          <Text
            style={[styles.fabPillLabel, { color: isDark ? "#EEF2F6" : "#0F172A" }]}
            numberOfLines={1}
          >
            {kk.dashboard.radialLauncherFabLabel}
          </Text>
          <View
            style={[
              styles.fabPillTrailIcon,
              { width: fabTrailIconSize + 10, height: fabTrailIconSize + 10 },
            ]}
          >
            {open ? (
              <MaterialIcons name="close" size={fabTrailIconSize} color="#E8C86A" />
            ) : (
              <MaterialIcons
                name="keyboard-arrow-down"
                size={fabTrailIconSize}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <GestureDetector gesture={open ? panCloseGesture : panOpenGesture}>
      <View
        style={[
          styles.root,
          open
            ? styles.rootFill
            : [styles.rootClosed, { height: closedHeight + LAUNCHER_SWIPE_OPEN_CAPTURE_ABOVE_PX }],
          open && styles.rootOpen,
        ]}
        accessibilityRole="menu"
        accessibilityLabel={kk.dashboard.radialLauncherMenuA11y}
      >
        {open && prayerHeader ? (
          <View style={styles.prayerHeaderSlot}>{prayerHeader}</View>
        ) : null}

        <Animated.View
          style={[
            styles.gridWrap,
            open ? styles.gridWrapFill : { height: metrics.gridBlockHeight },
            gridWrapStyle,
          ]}
          onLayout={
            open
              ? (e) => {
                  const { width, height } = e.nativeEvent.layout;
                  setGridLayout((prev) =>
                    prev.width === width && prev.height === height ? prev : { width, height }
                  );
                }
              : undefined
          }
          pointerEvents={open ? "auto" : "none"}
        >
          {gridMounted
            ? rows.map((row, rowIdx) => (
                <AnimatedGridRow
                  key={`row-${rowIdx}`}
                  rowIdx={rowIdx}
                  rowCount={rows.length}
                  progress={progress}
                  metrics={metrics}
                  fillRow={open}
                >
                  <View style={[styles.gridRow, open && styles.gridRowFill]}>
                    {row.map((item) => (
                      <View key={item.key} style={[styles.gridCellWrap, open && styles.gridCellWrapFill]}>
                        <GridAppTile
                          item={item}
                          size={activeTileSize}
                          corner={activeCorner}
                          isDark={isDark}
                          fill={open}
                          onPress={() => handleGridPress(item.key)}
                          styles={styles}
                        />
                      </View>
                    ))}
                    {row.length < 3
                      ? Array.from({ length: 3 - row.length }).map((_, i) => (
                          <View
                            key={`pad-${rowIdx}-${i}`}
                            style={[styles.gridCellWrap, open && styles.gridCellWrapFill]}
                          />
                        ))
                      : null}
                  </View>
                </AnimatedGridRow>
              ))
            : null}
        </Animated.View>

        <View
          style={[
            styles.bottomDock,
            open && styles.bottomDockFill,
            !open && styles.bottomDockClosed,
          ]}
          pointerEvents="box-none"
        >
          {!open ? (
            <View
              style={[styles.swipeOpenCapture, { height: LAUNCHER_SWIPE_OPEN_CAPTURE_ABOVE_PX }]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ) : null}
          <View style={[styles.bottomDockRow, { height: metrics.dockRowHeight }]}>
            <View style={styles.dockSideSlot} pointerEvents="none" />
            {fabCluster}
            <View style={styles.dockSideSlot} pointerEvents="none" />
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

function makeStyles(isDark: boolean, m: LauncherHubMetrics, open: boolean) {
  const { gridGap, dockGap } = m;

  return StyleSheet.create({
    root: {
      width: "100%",
      position: "relative",
      flexShrink: 0,
    },
    rootClosed: {
      justifyContent: "flex-end",
      overflow: "visible",
    },
    rootFill: {
      flex: 1,
      minHeight: 0,
      marginTop: 0,
      marginBottom: 0,
      flexDirection: "column",
    },
    prayerHeaderSlot: {
      flexShrink: 0,
      width: "100%",
      zIndex: 60,
      marginBottom: open ? 3 : gridGap,
      paddingHorizontal: open ? (Platform.OS === "ios" || Platform.OS === "android" ? 0 : 6) : 0,
    },
    rootOpen: {
      zIndex: Platform.OS === "web" ? 100 : 40,
      elevation: Platform.OS === "web" ? 100 : 40,
    },
    gridWrap: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      gap: gridGap,
      overflow: "visible",
      zIndex: 50,
      elevation: 50,
    },
    gridWrapFill: {
      position: "relative",
      top: 0,
      flex: 1,
      minHeight: 0,
      height: undefined,
    },
    gridRow: {
      flexDirection: "row",
      gap: gridGap,
      justifyContent: "space-between",
      alignItems: "stretch",
    },
    gridRowFill: {
      flex: 1,
      minHeight: 0,
    },
    gridCellWrap: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
    },
    gridCellWrapFill: {
      flex: 1,
      minHeight: 0,
      alignItems: "stretch",
      justifyContent: "center",
    },
    gridCell: {
      alignItems: "center",
      width: "100%",
    },
    gridCellFill: {
      flex: 1,
      minHeight: 0,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    gridTile: {
      overflow: "hidden",
      borderWidth: 1.5,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
        },
        android: { elevation: 4 },
        default: {},
      }),
    },
    tileImageFrame: {
      flex: 1,
      width: "100%",
      height: "100%",
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    tileImageFill: {
      width: "100%",
      height: "100%",
      maxWidth: "100%",
      maxHeight: "100%",
    },
    bottomDock: {
      width: "100%",
      justifyContent: "flex-end",
      paddingBottom: LAUNCHER_FAB_DOWN_OFFSET_PX,
    },
    bottomDockRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: dockGap,
      width: "100%",
    },
    swipeOpenCapture: {
      width: "100%",
    },
    bottomDockClosed: {
      position: "relative",
    },
    bottomDockFill: {
      flexShrink: 0,
      marginTop: open ? 3 : 0,
    },
    dockSideSlot: {
      width: m.gridItemSize,
      alignItems: "center",
      justifyContent: "center",
    },
    fabCluster: {
      alignItems: "center",
      justifyContent: "center",
      zIndex: 55,
      elevation: 55,
    },
    fabPillPress: {
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 10,
        },
        android: { elevation: 8 },
        default: {},
      }),
    },
    fabPillRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 14,
      width: "100%",
    },
    fabPillLogoSlot: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    fabPillLabel: {
      flex: 1,
      textAlign: "center",
      fontSize: 14,
      fontFamily: BRAND_FONT_FACE.extrabold,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    fabPillTrailIcon: {
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    pressDown: {
      opacity: 0.88,
      transform: [{ scale: 0.96 }],
    },
  });
}
