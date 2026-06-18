import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Platform,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import {
  fetchHalalDamuProductsBrowse,
  fetchHalalDamuRecentCompanies,
  halalDamuRemoteImageThumbnailUrl,
  type HalalDamuCompanyListRow,
  type HalalDamuProductItem,
} from "../../api/halalDamuWp";
import { kk } from "../../i18n/kk";
import { getRaqatApiBase } from "../../config/raqatApiBase";
import { menuIconAssets } from "../../theme/menuIconAssets";
import type { ThemeColors } from "../../theme/colors";
import { halalCertBadgeColors, halalCertTone } from "../../utils/halalCertDisplay";
import { runWhenHeavyWorkAllowed } from "../../utils/uiDefer";

const ROTATOR_LIMIT = 3;
const RECENT_COMPANY_IMAGE_SCAN_LIMIT = 6;
const SNAPSHOT_KEY = "raqat_dashboard_halal_rotator_v3";
const SNAPSHOT_TTL_MS = 6 * 60 * 60 * 1000;
const PRODUCT_CARD_GAP = 8;
const VISIBLE_PRODUCT_CARDS = 3.15;
const AUTO_ADVANCE_MS = 5200;

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

type ProductImageMode = "proxy" | "thumbnail" | "original";

function productSubtitle(item: HalalDamuProductItem): string {
  const brand = (item.seedBrand ?? "").trim();
  const barcode = (item.barcode ?? "").trim();
  if (brand && barcode) return `${brand} · ${barcode}`;
  return brand || barcode || kk.features.halalProductStatusHalal;
}

function productOriginalImageUrl(item: HalalDamuProductItem): string {
  const url = (item.imageUrl ?? "").trim();
  return url;
}

function proxiedDashboardHalalImageUrl(url: string, width = 300): string {
  const apiBase = getRaqatApiBase();
  if (!apiBase) return halalDamuRemoteImageThumbnailUrl(url, width);
  return `${apiBase}/api/v1/image-proxy?url=${encodeURIComponent(url)}&w=${width}`;
}

function productImageSource(item: HalalDamuProductItem, imageMode: ProductImageMode): ImageSourcePropType {
  const url = productOriginalImageUrl(item);
  if (!url) return menuIconAssets.tileHalal;
  const proxyUrl = proxiedDashboardHalalImageUrl(url, 300);
  const fallbackUrl = halalDamuRemoteImageThumbnailUrl(url, 300);
  const uri = imageMode === "proxy" ? proxyUrl : imageMode === "thumbnail" ? fallbackUrl : url;
  return { uri, cache: "force-cache" };
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

type HalalRotatorSnapshot = {
  items: HalalDamuProductItem[];
  fresh: boolean;
};

async function readHalalRotatorSnapshot(): Promise<HalalRotatorSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as { savedAt?: string; items?: HalalDamuProductItem[] };
    if (!payload.savedAt || !payload.items?.length) return null;
    const age = Date.now() - new Date(payload.savedAt).getTime();
    if (!Number.isFinite(age)) return null;
    return {
      items: payload.items.slice(0, ROTATOR_LIMIT),
      fresh: age <= SNAPSHOT_TTL_MS,
    };
  } catch {
    return null;
  }
}

async function writeHalalRotatorSnapshot(items: HalalDamuProductItem[]): Promise<void> {
  if (!items.length) return;
  try {
    await AsyncStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), items: items.slice(0, ROTATOR_LIMIT) })
    );
  } catch {
    /* snapshot is a best-effort dashboard speed-up */
  }
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

const ProductSlide = memo(function ProductSlide({ item, slideWidth, isDark, styles }: ProductSlideProps) {
  const tone = halalCertTone(item.certificateStatus);
  const badge = halalCertBadgeColors(tone, isDark);
  const subtitle = productSubtitle(item);
  const originalImageUrl = productOriginalImageUrl(item);
  const proxyUrl = originalImageUrl ? proxiedDashboardHalalImageUrl(originalImageUrl, 300) : "";
  const [imageMode, setImageMode] = useState<ProductImageMode>("proxy");
  const imageSource = productImageSource(item, imageMode);

  useEffect(() => {
    setImageMode("proxy");
  }, [proxyUrl]);

  return (
    <View style={[styles.slide, slideWidth > 0 ? { width: slideWidth } : null]}>
      <View style={[styles.productImageFrame, { borderColor: badge.border }]}>
        <RasterImage
          source={imageSource}
          style={styles.productImage}
          resizeMode="cover"
          resizeMethod={Platform.OS === "android" ? "resize" : undefined}
          resizeMultiplier={Platform.OS === "android" ? 0.7 : undefined}
          fadeDuration={0}
          onError={() => {
            setImageMode((prev) => (prev === "proxy" ? "thumbnail" : prev === "thumbnail" ? "original" : prev));
          }}
          accessibilityIgnoresInvertColors
        />
        <View style={[styles.verifiedBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <MaterialIcons name="verified" size={13} color={badge.dot} />
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
});

export function DashboardHalalProductsRotator({ colors, isDark, onOpenCatalog }: Props) {
  const [items, setItems] = useState<HalalDamuProductItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [slideWidth, setSlideWidth] = useState(0);
  const scrollOffsetRef = useRef(0);
  const focusedRef = useRef(true);
  const appActiveRef = useRef(true);
  const listRef = useRef<React.ComponentRef<typeof GestureHandlerFlatList<HalalDamuProductItem>> | null>(
    null
  );
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const total = items.length;
  const productCardWidth =
    slideWidth > 0
      ? Math.max(58, Math.floor((slideWidth - PRODUCT_CARD_GAP * 3 - 20) / VISIBLE_PRODUCT_CARDS))
      : 76;
  const slideStep = productCardWidth + PRODUCT_CARD_GAP;
  const loopItems = useMemo(() => (items.length > 1 ? [...items, ...items] : items), [items]);
  const active = items[0];

  useEffect(() => {
    let alive = true;
    setLoadState("loading");
    void (async () => {
      const snapshot = await readHalalRotatorSnapshot();
      if (!alive) return null;
      if (snapshot?.items.length) {
        setItems(snapshot.items);
        setLoadState("ready");
        if (snapshot.fresh) return snapshot.items;
      }
      await runWhenHeavyWorkAllowed();
      const nextItems = await fetchDashboardHalalImageProducts();
      await writeHalalRotatorSnapshot(nextItems);
      return nextItems;
    })()
      .then((nextItems) => {
        if (!alive || !nextItems) return;
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
    const sub = AppState.addEventListener("change", (state) => {
      appActiveRef.current = state === "active";
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (slideStep <= 0 || total <= 1) return;
    const loopWidth = total * slideStep;
    const id = setInterval(() => {
      if (!focusedRef.current || !appActiveRef.current || slideStep <= 0) return;
      let nextOffset = scrollOffsetRef.current + slideStep;
      if (nextOffset >= loopWidth) {
        nextOffset -= loopWidth;
      }
      scrollOffsetRef.current = nextOffset;
      listRef.current?.scrollToOffset({ offset: nextOffset, animated: true });
    }, AUTO_ADVANCE_MS);
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
          ? "Халал тексеру каталогы"
          : "Халал каталог дайын";
    const fallbackBody =
      loadState === "loading"
        ? "Сертификатталған өнімдер витринасы ашылып жатыр."
        : "Өнім атауын, штрихкодты немесе өндірушіні енгізіп, сертификат мәліметін тексеріңіз.";
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
        initialNumToRender={2}
        maxToRenderPerBatch={1}
        updateCellsBatchingPeriod={120}
        windowSize={1}
        removeClippedSubviews={Platform.OS !== "web"}
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
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 9,
    },
    slide: {
      alignItems: "stretch",
      gap: 4,
      padding: 4,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
    },
    productImageFrame: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 10,
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
      right: 4,
      bottom: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
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
