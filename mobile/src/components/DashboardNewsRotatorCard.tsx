import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Platform, Linking, type LayoutChangeEvent } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import { KURBAN_AIT_DASHBOARD_HERO_ASPECT } from "../content/kurbanAitBlockContent";
import {
  DASHBOARD_NEWS_ROTATE_MS,
  type DashboardNewsItem,
} from "../content/dashboardNewsItems";
import { useDashboardNewsItems } from "../hooks/useDashboardNewsItems";
import {
  officialIslamicSourceHomeUrl,
} from "../config/officialIslamicSources";
import { kk } from "../i18n/kk";
import type { ThemeColors } from "../theme/colors";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  onOpenItem: (item: DashboardNewsItem) => void;
  /** Mockup: сурет үстінде, bookmark + «Мақала» тегі */
  mockupCards?: boolean;
};

type NewsSlideProps = {
  item: DashboardNewsItem;
  slideWidth: number;
  styles: ReturnType<typeof makeStyles>;
  onOpenItem: (item: DashboardNewsItem) => void;
  mockupCards?: boolean;
};

function newsA11yLabel(item: DashboardNewsItem): string {
  return kk.dashboard.newsOpenTopic(item.title);
}

const NewsSlide = memo(function NewsSlide({ item, slideWidth, styles, onOpenItem, mockupCards }: NewsSlideProps) {
  const hasRemoteImage = Boolean(item.imageUrl);
  if (mockupCards) {
    return (
      <Pressable
        oyuBackdrop={false}
        onPress={() => onOpenItem(item)}
        style={({ pressed }) => [
          styles.mockupSlide,
          slideWidth > 0 ? { width: slideWidth } : null,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={newsA11yLabel(item)}
      >
        <View style={styles.mockupImageFrame}>
          <RasterImage
            source={item.image}
            style={styles.mockupImage}
            resizeMode={hasRemoteImage ? "cover" : "contain"}
            resizeMethod={Platform.OS === "android" ? "resize" : undefined}
            resizeMultiplier={Platform.OS === "android" ? 0.72 : undefined}
            zoomNested
            accessibilityIgnoresInvertColors
          />
          <View style={styles.mockupBadge}>
            <Text style={styles.mockupBadgeTxt}>{kk.dashboard.articleBadge}</Text>
          </View>
          <View style={styles.mockupBookmark} accessibilityElementsHidden>
            <Text style={styles.mockupBookmarkIcon}>🔖</Text>
          </View>
        </View>
        <Text style={styles.mockupTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.sourceLabel ? (
          <Text style={styles.mockupSource} numberOfLines={1}>
            {item.sourceLabel}
          </Text>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      oyuBackdrop={false}
      onPress={() => onOpenItem(item)}
      style={({ pressed }) => [
        styles.slide,
        slideWidth > 0 ? { width: slideWidth } : null,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={newsA11yLabel(item)}
    >
      <Text style={styles.title} accessibilityRole="header">
        {item.title}
      </Text>
      {item.subtitle ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {item.sourceLabel && item.subtitle !== item.sourceLabel
            ? `${item.sourceLabel} · ${item.subtitle}`
            : item.subtitle}
        </Text>
      ) : item.sourceLabel ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.sourceLabel}
        </Text>
      ) : null}

      <View style={styles.heroImageFrame}>
        <RasterImage
          source={item.image}
          style={styles.heroImage}
          resizeMode={hasRemoteImage ? "cover" : "contain"}
          resizeMethod={Platform.OS === "android" ? "resize" : undefined}
          resizeMultiplier={Platform.OS === "android" ? 0.72 : undefined}
          zoomNested
          accessibilityIgnoresInvertColors
        />
      </View>
    </Pressable>
  );
});

/** Басты бет: Fatua/Muftyat немесе API жоқ болса Құрбан айт каруселі. */
export const DashboardNewsRotatorCard = memo(function DashboardNewsRotatorCard({ colors, isDark, onOpenItem, mockupCards }: Props) {
  const { items } = useDashboardNewsItems();
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const indexRef = useRef(0);
  const focusedRef = useRef(true);
  const listRef = useRef<React.ComponentRef<typeof GestureHandlerFlatList<DashboardNewsItem>> | null>(
    null
  );
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const itemsKey = useMemo(() => items.map((row) => row.id).join("|"), [items]);
  const total = items.length;
  const item = items[index] ?? items[0];
  const cardWidth = mockupCards && slideWidth > 0 ? slideWidth * 0.36 : slideWidth;
  const slideStep = mockupCards && cardWidth > 0 ? cardWidth + 5 : slideWidth;

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    if (slideStep > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [itemsKey, slideStep]);

  const goToIndex = useCallback(
    (next: number, animated = true) => {
      if (slideStep <= 0 || total <= 0) return;
      const clamped = ((next % total) + total) % total;
      indexRef.current = clamped;
      setIndex(clamped);
      listRef.current?.scrollToOffset({ offset: clamped * slideStep, animated });
    },
    [slideStep, total]
  );

  const onCarouselLayout = useCallback((event: LayoutChangeEvent) => {
    const w = Math.round(event.nativeEvent.layout.width);
    if (w > 0) setSlideWidth(w);
  }, []);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, [])
  );

  useEffect(() => {
    if (slideStep <= 0 || total <= 1) return;
    listRef.current?.scrollToOffset({
      offset: indexRef.current * slideStep,
      animated: false,
    });
  }, [slideStep, total]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      if (!focusedRef.current || slideStep <= 0) return;
      goToIndex(indexRef.current + 1);
    }, DASHBOARD_NEWS_ROTATE_MS);
    return () => clearInterval(id);
  }, [total, slideStep, goToIndex]);

  const onMomentumScrollEnd = useCallback(
    (offsetX: number) => {
      if (slideStep <= 0) return;
      const next = Math.round(offsetX / slideStep);
      const clamped = Math.min(Math.max(next, 0), total - 1);
      indexRef.current = clamped;
      setIndex(clamped);
    },
    [slideStep, total]
  );

  const renderItem = useCallback(
    ({ item: row }: { item: DashboardNewsItem }) => (
      <NewsSlide
        item={row}
        slideWidth={mockupCards ? cardWidth : slideWidth}
        styles={styles}
        onOpenItem={onOpenItem}
        mockupCards={mockupCards}
      />
    ),
    [cardWidth, slideWidth, styles, onOpenItem, mockupCards]
  );

  if (!item) return null;

  return (
    <View
      style={mockupCards ? styles.mockupOuter : styles.card}
      onLayout={onCarouselLayout}
      accessibilityLabel={kk.dashboard.newsRotatorA11y(index + 1, total, item.title)}
    >
      <GestureHandlerFlatList
        ref={listRef}
        data={items}
        horizontal
        pagingEnabled={!mockupCards}
        snapToInterval={mockupCards && slideStep > 0 ? slideStep : undefined}
        snapToAlignment={mockupCards ? "start" : undefined}
        disableIntervalMomentum={mockupCards}
        bounces={total > 1}
        decelerationRate={mockupCards ? "normal" : "fast"}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        keyExtractor={(row) => row.id}
        renderItem={renderItem}
        ItemSeparatorComponent={mockupCards ? () => <View style={{ width: 6 }} /> : undefined}
        getItemLayout={
          slideStep > 0
            ? (_, i) => ({ length: slideStep, offset: slideStep * i, index: i })
            : undefined
        }
        onMomentumScrollEnd={(event) => onMomentumScrollEnd(event.nativeEvent.contentOffset.x)}
        onScrollEndDrag={(event) => {
          if (Platform.OS === "web") {
            onMomentumScrollEnd(event.nativeEvent.contentOffset.x);
          }
        }}
        scrollEventThrottle={16}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        updateCellsBatchingPeriod={120}
        windowSize={1}
        removeClippedSubviews={Platform.OS !== "web"}
        style={styles.list}
        contentContainerStyle={mockupCards ? styles.mockupListContent : undefined}
      />

      {!mockupCards && total > 1 ? (
        <View style={styles.dotsRow} accessibilityElementsHidden importantForAccessibility="no">
          {items.map((row, i) => (
            <View
              key={row.id}
              style={[styles.dot, i === index ? styles.dotActive : styles.dotIdle]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
});

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const cardBorder = isDark ? "rgba(34, 197, 94, 0.32)" : colors.border;
  return StyleSheet.create({
    sourceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingTop: 10,
      paddingHorizontal: 12,
    },
    sourceChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    sourceChipText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    sourceDivider: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      opacity: 0.5,
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: cardBorder,
      backgroundColor: colors.card,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.2 : 0.08,
          shadowRadius: 10,
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    list: {
      flexGrow: 0,
    },
    slide: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 10,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: 0.2,
      lineHeight: 24,
      paddingHorizontal: 2,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 16,
      marginTop: 2,
      paddingHorizontal: 2,
    },
    heroImageFrame: {
      width: "100%",
      aspectRatio: KURBAN_AIT_DASHBOARD_HERO_ASPECT,
      backgroundColor: colors.accentSurface,
      borderRadius: 12,
      overflow: "hidden",
      marginTop: 6,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    dotsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingTop: 8,
      paddingBottom: 10,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    dotActive: {
      backgroundColor: colors.accent,
      opacity: 1,
    },
    dotIdle: {
      backgroundColor: colors.muted,
      opacity: 0.35,
    },
    pressed: {
      opacity: 0.92,
    },
    mockupOuter: {
      marginHorizontal: -2,
    },
    mockupListContent: {
      paddingRight: 4,
    },
    mockupSlide: {
      flexShrink: 0,
    },
    mockupImageFrame: {
      width: "100%",
      aspectRatio: 2.25,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: colors.accentSurface,
      position: "relative",
    },
    mockupImage: {
      width: "100%",
      height: "100%",
    },
    mockupBadge: {
      position: "absolute",
      left: 5,
      bottom: 5,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    mockupBadgeTxt: {
      color: "#fff",
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 0.1,
    },
    mockupBookmark: {
      position: "absolute",
      top: 5,
      right: 5,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.92)",
      alignItems: "center",
      justifyContent: "center",
    },
    mockupBookmarkIcon: {
      fontSize: 10,
    },
    mockupTitle: {
      color: colors.text,
      fontSize: 10,
      fontWeight: "800",
      lineHeight: 13,
      marginTop: 3,
      paddingHorizontal: 1,
    },
    mockupSource: {
      color: colors.muted,
      fontSize: 8,
      fontWeight: "800",
      lineHeight: 10,
      marginTop: 1,
      paddingHorizontal: 1,
    },
  });
}
