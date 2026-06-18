import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { surahListMetaSubtitle, surahListNumberedTitle, mushafStartPageForSurah } from "../../data/surahListMeta";
import { modalSheetBottomPadding } from "../../utils/modalSheetInsets";

export type HatimSurahSearchRow = {
  number: number;
  name: string;
  ayahCount: number;
};

function quranSurahListPalette(colors: ThemeColors, isDark: boolean) {
  return {
    screenBg: isDark ? colors.bg : "#F2F2F7",
  };
}

type Props = {
  visible: boolean;
  colors: ThemeColors;
  isDark: boolean;
  rows: HatimSurahSearchRow[];
  onClose: () => void;
  onPick: (surahNumber: number) => void;
};

export function filterHatimSurahRows(rows: HatimSurahSearchRow[], query: string): HatimSurahSearchRow[] {
  const t = query.trim().toLowerCase();
  if (!t) return rows;
  return rows.filter((row) => {
    const num = String(row.number);
    const title = row.name.toLowerCase();
    return num === t || num.startsWith(t) || title.includes(t);
  });
}

export function HatimSurahSearchSheet({
  visible,
  colors,
  isDark,
  rows,
  onClose,
  onPick,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetBottomPad = modalSheetBottomPadding(insets);
  const [query, setQuery] = useState("");
  const palette = useMemo(() => quranSurahListPalette(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => makeStyles(colors, isDark, palette.screenBg), [colors, isDark, palette.screenBg]);
  const filtered = useMemo(() => filterHatimSurahRows(rows, query), [rows, query]);

  useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);

  const onSelect = useCallback(
    (surahNumber: number) => {
      onPick(surahNumber);
      onClose();
    },
    [onClose, onPick]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.card, { paddingBottom: sheetBottomPad }]}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{kk.hatim.searchTitle}</Text>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={kk.common.cancel}
            >
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>
          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={kk.hatim.searchPlaceholder}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus={visible}
              accessibilityLabel={kk.hatim.searchPlaceholder}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={kk.hatim.searchClearA11y}
              >
                <MaterialIcons name="close" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.number)}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={
              filtered.length === 0
                ? [styles.listEmptyPad, { paddingBottom: sheetBottomPad }]
                : [styles.listPad, { paddingBottom: sheetBottomPad }]
            }
            ListEmptyComponent={
              <Text style={styles.emptyTxt}>{kk.hatim.searchEmpty}</Text>
            }
            renderItem={({ item }) => {
              const page = mushafStartPageForSurah(item.number);
              const numberedTitle = surahListNumberedTitle(item.number, item.name);
              const metaSubtitle = surahListMetaSubtitle(item.ayahCount, page);
              return (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => onSelect(item.number)}
                  accessibilityRole="button"
                  accessibilityLabel={kk.hatim.searchRowA11y(numberedTitle, metaSubtitle)}
                >
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {numberedTitle}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {metaSubtitle}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean, screenBg: string) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    card: {
      maxHeight: "82%",
      minHeight: 320,
      backgroundColor: screenBg,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingBottom: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 8,
      marginBottom: 4,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
    },
    closeBtn: {
      padding: 4,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 14,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 10 : 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : colors.card,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 0,
    },
    list: {
      flexGrow: 0,
    },
    listPad: {
      paddingHorizontal: 10,
      paddingBottom: 8,
    },
    listEmptyPad: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 16,
    },
    emptyTxt: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
    },
    row: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 6,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    rowPressed: {
      opacity: 0.9,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    rowMeta: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
    },
  });
}
