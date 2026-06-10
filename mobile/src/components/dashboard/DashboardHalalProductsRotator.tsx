import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import {
  fetchHalalDamuProductsBrowse,
  fetchHalalDamuRecentCompanies,
  type HalalDamuCompanyListRow,
  type HalalDamuProductItem,
} from "../../api/halalDamuWp";
import { kk } from "../../i18n/kk";
import { menuIconAssets } from "../../theme/menuIconAssets";
import type { ThemeColors } from "../../theme/colors";
import { halalCertBadgeColors, halalCertTone } from "../../utils/halalCertDisplay";

const ROTATOR_LIMIT = 50;
const RECENT_COMPANY_IMAGE_SCAN_LIMIT = 90;
const PRODUCT_CARD_GAP = 8;
const VISIBLE_PRODUCT_CARDS = 4.5;
const MARQUEE_TICK_MS = 32;
const MARQUEE_STEP_PX = 0.85;

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  onOpenCatalog: () => void;
};

type ProductSlideProps = {
  item: HalalDamuProductItem;
  slideWidth: number;
  isDark: boolean;
  styles: ReturnType<typeof makeStyles>;
};

function productSubtitle(item: HalalDamuProductItem): string {
  const brand = (item.seedBrand ?? "").trim();
  const barcode = (item.barcode ?? "").trim();
  if (brand && barcode) return `${brand} · ${barcode}`;
  return brand || barcode || kk.features.halalProductStatusHalal;
}

function productImageSource(item: HalalDamuProductItem): ImageSourcePropType {
  const url = (item.imageUrl ?? "").trim();
  return url ? { uri: url } : menuIconAssets.tileHalal;
}

function recentCompanyRowToProduct(row: HalalDamuCompanyListRow): HalalDamuProductItem | null {
  const imageUrl = (row.thumbnailUrl ?? "").trim();
  if (!imageUrl) return null;
  return {
    id: row.id,
    title: row.title,
    barcode: null,
    certificateStatus: "active",
    imageUrl,
    companyId: row.id,
    fromCertifiedProducer: true,
  };
}

function dedupeImageProducts(items: HalalDamuProductItem[]): HalalDamuProductItem[] {
  const seen = new Set<string>();
  const out: HalalDamuProductItem[] = [];
  for (const item of items) {
    const imageUrl = (item.imageUrl ?? "").trim();
    if (!imageUrl) continue;
    const key = `${item.title.trim().toLowerCase()}|${imageUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchDashboardHalalImageProducts(): Promise<HalalDamuProductItem[]> {
  const [products, recent] = await Promise.all([
    fetchHalalDamuProductsBrowse({ perPage: RECENT_COMPANY_IMAGE_SCAN_LIMIT, page: 1, status: "halal" }),
    fetchHalalDamuRecentCompanies(RECENT_COMPANY_IMAGE_SCAN_LIMIT, 1),
  ]);
  const productItems = products.items.filter((item) => (item.imageUrl ?? "").trim());
  const recentItems = recent.rows
    .map((row) => recentCompanyRowToProduct(row))
    .filter((item): item is HalalDamuProductItem => item != null);
  return dedupeImageProducts([...productItems, ...recentItems]).slice(0, ROTATOR_LIMIT);
}

function ProductSlide({ item, slideWidth, isDark, styles }: ProductSlideProps) {
  const tone = halalCertTone(item.certificateStatus);
  const badge = halalCertBadgeColors(tone, isDark);
  const subtitle = productSubtitle(item);
  const imageSource = productImageSource(item);

  return (
    <View style={[styles.slide, slideWidth > 0 ? { width: slideWidth } : null]}>
      <View style={[styles.productImageFrame, { borderColor: badge.border }]}>
        <RasterImage
          source={imageSource}
          style={styles.productImage}
          resizeMode="cover"
          resizeMethod={Platform.OS === "android" ? "resize" : undefined}
          accessibilityIgnoresInvertColors
        />
        <View style={[styles.verifiedBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <MaterialIcons name="verified" size={15} color={badge.dot} />
        </View>
      </View>
      <View style={styles.productBody}>
        <Text style={styles.productEyebrow} numberOfLines={1}>
          {kk.dashboard.halalProductsRotatorBadge}
        </Text>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.productSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export function DashboardHalalProductsRotator({ colors, isDark, onOpenCatalog }: Props) {
  const [items, setItems] = useState<HalalDamuProductItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [slideWidth, setSlideWidth] = useState(0);
  const scrollOffsetRef = useRef(0);
  const focusedRef = useRef(true);
  const listRef = useRef<React.ComponentRef<typeof GestureHandlerFlatList<HalalDamuProductItem>> | null>(
    null
  );
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const total = items.length;
  const productCardWidth =
    slideWidth > 0
      ? Math.max(68, Math.floor((slideWidth - PRODUCT_CARD_GAP * 4 - 24) / VISIBLE_PRODUCT_CARDS))
      : 76;
  const slideStep = productCardWidth + PRODUCT_CARD_GAP;
  const loopItems = useMemo(() => (items.length > 1 ? [...items, ...items] : items), [items]);
  const active = items[0];

  useEffect(() => {
    let alive = true;
    setLoadState("loading");
    void fetchDashboardHalalImageProducts()
      .then((nextItems) => {
        if (!alive) return;
        setItems(nextItems);
        setLoadState(nextItems.length ? "ready" : "empty");
        scrollOffsetRef.current = 0;
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      })
      .catch(() => {
        if (!alive) return;
        setItems([]);
        setLoadState("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
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
    const loopWidth = total * slideStep;
    const id = setInterval(() => {
      if (!focusedRef.current || slideStep <= 0) return;
      let nextOffset = scrollOffsetRef.current + MARQUEE_STEP_PX;
      if (nextOffset >= loopWidth) {
        nextOffset -= loopWidth;
      }
      scrollOffsetRef.current = nextOffset;
      listRef.current?.scrollToOffset({ offset: nextOffset, animated: false });
    }, MARQUEE_TICK_MS);
    return () => clearInterval(id);
  }, [slideStep, total]);

  const onScrollOffset = useCallback(
    (offsetX: number) => {
      if (slideStep <= 0 || total <= 0) return;
      const loopWidth = total * slideStep;
      scrollOffsetRef.current = loopWidth > 0 ? offsetX % loopWidth : offsetX;
    },
    [slideStep, total]
  );

  const renderItem = useCallback(
    ({ item: row }: { item: HalalDamuProductItem }) => (
      <ProductSlide
        item={row}
        slideWidth={productCardWidth}
        isDark={isDark}
        styles={styles}
      />
    ),
    [isDark, productCardWidth, styles]
  );

  if (!active) {
    const fallbackTitle =
      loadState === "loading"
        ? kk.common.loading
        : loadState === "error"
          ? "Халал өнімдер уақытша жүктелмеді"
          : "Халал каталог дайын";
    const fallbackBody =
      loadState === "loading"
        ? "Сертификатталған өнімдер витринасы ашылып жатыр."
        : "Каталогты ашып, өнім, компания немесе штрихкод бойынша тексеріңіз.";
    return (
      <Pressable
        oyuBackdrop={false}
        onPress={onOpenCatalog}
        accessibilityRole="button"
        accessibilityLabel={kk.dashboard.halalProductsOpenCatalog}
        style={({ pressed }) => [styles.card, styles.fallbackCard, pressed && styles.overlayPressed]}
      >
        <View style={styles.fallbackIcon}>
          <MaterialIcons name="verified" size={22} color={colors.accent} />
        </View>
        <View style={styles.fallbackBody}>
          <Text style={styles.fallbackTitle}>{fallbackTitle}</Text>
          <Text style={styles.fallbackText}>{fallbackBody}</Text>
        </View>
        <MaterialIcons name="arrow-forward" size={20} color={colors.muted} />
      </Pressable>
    );
  }

  return (
    <View
      style={styles.card}
      onLayout={onLayout}
      accessibilityLabel={kk.dashboard.halalProductsRotatorA11y(1, total, active.title)}
    >
      <GestureHandlerFlatList
        ref={listRef}
        data={loopItems}
        horizontal
        scrollEnabled={false}
        bounces={total > 1}
        decelerationRate="normal"
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        keyExtractor={(row, i) => `${row.id}:${row.barcode ?? "no-barcode"}:${i}`}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ width: PRODUCT_CARD_GAP }} />}
        getItemLayout={
          slideStep > 0 ? (_, i) => ({ length: slideStep, offset: slideStep * i, index: i }) : undefined
        }
        onScroll={(event) => onScrollOffset(event.nativeEvent.contentOffset.x)}
        scrollEventThrottle={64}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
      <Pressable
        oyuBackdrop={false}
        onPress={onOpenCatalog}
        accessibilityRole="button"
        accessibilityLabel={kk.dashboard.halalProductsOpenCatalog}
        style={({ pressed }) => [styles.tapOverlay, pressed && styles.overlayPressed]}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const border = isDark ? "rgba(16, 185, 129, 0.34)" : "rgba(16, 185, 129, 0.26)";
  return StyleSheet.create({
    card: {
      marginTop: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    tapOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "transparent",
    },
    overlayPressed: {
      backgroundColor: "rgba(16, 185, 129, 0.05)",
    },
    fallbackCard: {
      minHeight: 92,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    fallbackIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    fallbackBody: {
      flex: 1,
      minWidth: 0,
    },
    fallbackTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "900",
    },
    fallbackText: {
      marginTop: 3,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600",
    },
    list: {
      flexGrow: 0,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 12,
    },
    slide: {
      alignItems: "stretch",
      gap: 5,
      padding: 5,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
    },
    productImageFrame: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 12,
      borderWidth: 1,
      overflow: "hidden",
      backgroundColor: colors.card,
    },
    productImage: {
      width: "100%",
      height: "100%",
    },
    verifiedBadge: {
      position: "absolute",
      right: 5,
      bottom: 5,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    productBody: {
      minWidth: 0,
    },
    productEyebrow: {
      color: colors.accent,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    productTitle: {
      marginTop: 1,
      color: colors.text,
      fontSize: 10,
      lineHeight: 12,
      fontWeight: "900",
    },
    productSub: {
      marginTop: 1,
      color: colors.muted,
      fontSize: 9,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
  });
}
