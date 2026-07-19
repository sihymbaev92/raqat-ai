import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { surahTitleForLocale } from "../../constants/surahTitleKk";
import { kk } from "../../i18n/kk";
import {
  QURAN_NAV_JUZ_VALUES,
  QURAN_NAV_SURAH_VALUES,
  clampQuranNavCoords,
  coordsFromJuz,
  coordsFromPage,
  coordsFromSurah,
  quranNavPageValuesForJuz,
  type QuranNavCoords,
} from "../../quran/quranNavPickerCoords";
import { modalSheetBottomPadding } from "../../utils/modalSheetInsets";
import { useAppLocale } from "../../i18n/runtime";

const ITEM_H = 44;
const WHEEL_ROWS = 5;
const WHEEL_H = ITEM_H * WHEEL_ROWS;
const WHEEL_PAD = ITEM_H * Math.floor(WHEEL_ROWS / 2);

export type QuranNavWheelColumns = "surah-juz-page" | "juz-page";

type Props = {
  visible: boolean;
  colors: ThemeColors;
  isDark: boolean;
  initial: QuranNavCoords;
  /** `juz-page` — тек джуз + бет (хатым/мұсаф навигация). */
  columns?: QuranNavWheelColumns;
  /** Web wheel: scroll/click таңдауы тоқтағанда бірден қолдану. */
  autoApplyOnChange?: boolean;
  onClose: () => void;
  onApply: (coords: QuranNavCoords) => void;
};

function indexForValue(values: readonly number[], v: number): number {
  const i = values.indexOf(v);
  return i >= 0 ? i : 0;
}

type WheelColumnProps = {
  items: readonly string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  scrollToken: number;
  colors: ThemeColors;
  isDark: boolean;
  /** Джуз ауысқанда бет тізімін web-те қайта құру */
  listKey?: string;
};

function WheelColumn({
  items,
  selectedIndex,
  onIndexChange,
  scrollToken,
  colors,
  isDark,
  listKey,
}: WheelColumnProps) {
  const listRef = useRef<FlatList<string>>(null);
  const styles = useMemo(() => makeColumnStyles(colors, isDark), [colors, isDark]);
  const fromScrollRef = useRef(false);

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      listRef.current?.scrollToOffset({ offset: clamped * ITEM_H, animated });
    },
    [items.length]
  );

  useEffect(() => {
    if (fromScrollRef.current) {
      fromScrollRef.current = false;
      return;
    }
    scrollToIndex(selectedIndex, false);
  }, [scrollToken, selectedIndex, scrollToIndex]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      fromScrollRef.current = true;
      onIndexChange(clamped);
    },
    [items.length, onIndexChange]
  );

  const onItemPress = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      fromScrollRef.current = true;
      onIndexChange(clamped);
      scrollToIndex(clamped, true);
    },
    [items.length, onIndexChange, scrollToIndex]
  );

  return (
    <View style={styles.col}>
      <FlatList
        ref={listRef}
        key={listKey}
        data={items as string[]}
        keyExtractor={(_, i) => String(i)}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: WHEEL_PAD }}
        getItemLayout={(_, index) => ({
          length: ITEM_H,
          offset: ITEM_H * index + WHEEL_PAD,
          index,
        })}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onMomentumScrollEnd}
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [
              styles.item,
              Platform.OS === "web" && styles.itemWeb,
              pressed && { opacity: 0.82 },
            ]}
            onPress={() => onItemPress(index)}
            accessibilityRole="button"
            accessibilityState={{ selected: index === selectedIndex }}
          >
            <Text
              style={[styles.itemTxt, index === selectedIndex && styles.itemTxtSelected]}
              numberOfLines={1}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

/** Сүре · джуз · бет wheel picker (мұсаф / хатым навигация). */
export function QuranNavWheelSheet({
  visible,
  colors,
  isDark,
  initial,
  columns = "surah-juz-page",
  autoApplyOnChange = false,
  onClose,
  onApply,
}: Props) {
  const locale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const insets = useSafeAreaInsets();
  const sheetBottomPad = modalSheetBottomPadding(insets);
  const juzPageOnly = columns === "juz-page";
  const tg = kk.hatim;
  const styles = useMemo(() => makeSheetStyles(colors, isDark), [colors, isDark]);
  const [coords, setCoords] = useState<QuranNavCoords>(() => clampQuranNavCoords(initial));
  const [scrollToken, setScrollToken] = useState(0);
  const [pageScrollToken, setPageScrollToken] = useState(0);
  const autoApplyReadyRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    autoApplyReadyRef.current = false;
    setCoords(clampQuranNavCoords(initial));
    setScrollToken((t) => t + 1);
    setPageScrollToken((t) => t + 1);
    const ready = setTimeout(() => {
      autoApplyReadyRef.current = true;
    }, 280);
    return () => clearTimeout(ready);
  }, [visible, initial.surah, initial.juz, initial.page]);

  useEffect(() => {
    if (!visible || !autoApplyOnChange || !autoApplyReadyRef.current) return;
    const t = setTimeout(() => {
      onApply(coords);
    }, Platform.OS === "web" ? 420 : 0);
    return () => clearTimeout(t);
  }, [autoApplyOnChange, coords, onApply, visible]);

  const pageValues = useMemo(() => quranNavPageValuesForJuz(coords.juz), [coords.juz]);

  const surahLabels = useMemo(
    () =>
      QURAN_NAV_SURAH_VALUES.map((n) =>
        tg.navPickerSurahLabel(n, surahTitleForLocale(n, locale, { tr }))
      ),
    [locale, tg, tr]
  );
  const juzLabels = useMemo(
    () => QURAN_NAV_JUZ_VALUES.map((n) => tg.navPickerJuzLabel(n)),
    [tg]
  );
  const pageLabels = useMemo(
    () => pageValues.map((n) => tg.navPickerPageLabel(n)),
    [pageValues, tg]
  );

  const bumpScroll = useCallback(() => setScrollToken((t) => t + 1), []);
  const bumpPageScroll = useCallback(() => setPageScrollToken((t) => t + 1), []);

  const applyCoords = useCallback(
    (next: ReturnType<typeof coordsFromSurah>, syncPageWheel = false) => {
      setCoords(next);
      bumpScroll();
      if (syncPageWheel) bumpPageScroll();
    },
    [bumpScroll, bumpPageScroll]
  );

  const onSurahIndex = useCallback(
    (index: number) => {
      const surah = QURAN_NAV_SURAH_VALUES[index] ?? 1;
      if (surah === coords.surah) return;
      applyCoords(coordsFromSurah(surah), true);
    },
    [applyCoords, coords.surah]
  );

  const onJuzIndex = useCallback(
    (index: number) => {
      const juz = QURAN_NAV_JUZ_VALUES[index] ?? 1;
      if (juz === coords.juz) return;
      applyCoords(coordsFromJuz(juz), true);
    },
    [applyCoords, coords.juz]
  );

  const onPageIndex = useCallback(
    (index: number) => {
      const page = pageValues[index] ?? pageValues[0] ?? 1;
      if (page === coords.page) return;
      applyCoords(coordsFromPage(page));
    },
    [applyCoords, coords.page, pageValues]
  );

  const surahIndex = indexForValue(QURAN_NAV_SURAH_VALUES, coords.surah);
  const juzIndex = indexForValue(QURAN_NAV_JUZ_VALUES, coords.juz);
  const pageIndex = useMemo(() => {
    const i = pageValues.indexOf(coords.page);
    return i >= 0 ? i : 0;
  }, [pageValues, coords.page]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.card, { paddingBottom: sheetBottomPad }]}>
          <View style={styles.handle} />
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={kk.common.cancel}
          >
            <MaterialIcons name="close" size={22} color={colors.muted} />
          </Pressable>

          <View style={styles.headerRow}>
            {juzPageOnly ? (
              <>
                <Text style={styles.colHead}>{tg.navPickerColPage}</Text>
                <Text style={styles.colHead}>{tg.navPickerColJuz}</Text>
              </>
            ) : (
              <>
                <Text style={styles.colHead}>{tg.navPickerColSurah}</Text>
                <Text style={styles.colHead}>{tg.navPickerColJuz}</Text>
                <Text style={styles.colHead}>{tg.navPickerColPage}</Text>
              </>
            )}
          </View>

          <View style={styles.wheelHost}>
            <View style={styles.selectionBand} pointerEvents="none" />
            <View style={styles.wheelRow}>
              {juzPageOnly ? (
                <>
                  <WheelColumn
                    items={pageLabels}
                    selectedIndex={pageIndex}
                    onIndexChange={onPageIndex}
                    scrollToken={pageScrollToken}
                    listKey={`page-juz-${coords.juz}`}
                    colors={colors}
                    isDark={isDark}
                  />
                  <WheelColumn
                    items={juzLabels}
                    selectedIndex={juzIndex}
                    onIndexChange={onJuzIndex}
                    scrollToken={scrollToken}
                    colors={colors}
                    isDark={isDark}
                  />
                </>
              ) : (
                <>
                  <WheelColumn
                    items={surahLabels}
                    selectedIndex={surahIndex}
                    onIndexChange={onSurahIndex}
                    scrollToken={scrollToken}
                    colors={colors}
                    isDark={isDark}
                  />
                  <WheelColumn
                    items={juzLabels}
                    selectedIndex={juzIndex}
                    onIndexChange={onJuzIndex}
                    scrollToken={scrollToken}
                    colors={colors}
                    isDark={isDark}
                  />
                  <WheelColumn
                    items={pageLabels}
                    selectedIndex={pageIndex}
                    onIndexChange={onPageIndex}
                    scrollToken={pageScrollToken}
                    listKey={`page-juz-${coords.juz}`}
                    colors={colors}
                    isDark={isDark}
                  />
                </>
              )}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.92 }]}
            onPress={() => onApply(coords)}
            accessibilityRole="button"
            accessibilityLabel={tg.navPickerApply}
          >
            <Text style={styles.applyTxt}>{tg.navPickerApply}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={tg.navPickerCancel}
          >
            <Text style={styles.cancelTxt}>{tg.navPickerCancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeColumnStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    col: { flex: 1, minWidth: 0, height: WHEEL_H, overflow: "hidden" },
    list: { flex: 1 },
    item: {
      height: ITEM_H,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    itemWeb: {
      cursor: "pointer",
    } as const,
    itemTxt: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.32)",
      textAlign: "center",
    },
    itemTxtSelected: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
  });
}

function makeSheetStyles(colors: ThemeColors, isDark: boolean) {
  const cardBg = isDark ? colors.card : "#ffffff";
  const bandBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  return StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    card: {
      backgroundColor: cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)",
      marginBottom: 8,
    },
    closeBtn: {
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 2,
      padding: 4,
    },
    headerRow: {
      flexDirection: "row",
      marginTop: 4,
      marginBottom: 6,
      paddingHorizontal: 4,
    },
    colHead: {
      flex: 1,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.8,
      color: colors.text,
    },
    wheelHost: {
      position: "relative",
      marginBottom: 16,
    },
    wheelRow: {
      flexDirection: "row",
      gap: 4,
    },
    selectionBand: {
      position: "absolute",
      left: 0,
      right: 0,
      top: WHEEL_PAD,
      height: ITEM_H,
      borderRadius: 10,
      backgroundColor: bandBg,
      zIndex: 1,
    },
    applyBtn: {
      alignSelf: "stretch",
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 10,
    },
    applyTxt: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "900",
      letterSpacing: 0.6,
    },
    cancelBtn: {
      alignSelf: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    cancelTxt: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "rgba(255,140,140,0.85)" : "#c0392b",
    },
  });
}
