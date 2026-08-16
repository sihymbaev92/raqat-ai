import React, { useEffect, useMemo } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { modalSheetBottomPadding } from "../../utils/modalSheetInsets";
import { useKeyboardOffset } from "../../hooks/useKeyboardOffset";
import { surahEnglishName } from "../../data/surahEnglishName";
import { prefetchQuranAyahSearch } from "../../quran/searchQuranAyahs";
import { QuranAyahWordSearch } from "./QuranAyahWordSearch";
import { getCurrentLocale, useAppLocale } from "../../i18n/runtime";

type Props = {
  visible: boolean;
  colors: ThemeColors;
  isDark: boolean;
  onClose: () => void;
  onOpenAyah: (surah: number, ayah: number) => void;
};

export function HatimAyahWordSearchSheet({
  visible,
  colors,
  isDark,
  onClose,
  onOpenAyah,
}: Props) {
  useAppLocale();
  const insets = useSafeAreaInsets();
  const sheetBottomPad = modalSheetBottomPadding(insets);
  const keyboardOffset = useKeyboardOffset();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const surahEnglishNames = useMemo(() => {
    const map = new Map<number, string>();
    for (let n = 1; n <= 114; n += 1) {
      map.set(n, surahEnglishName(n));
    }
    return map;
  }, []);
  const cardBottomPad = keyboardOffset > 0 ? 12 : sheetBottomPad;
  const cardMaxHeight = useMemo(() => {
    const winH = Dimensions.get("window").height;
    if (keyboardOffset <= 0) return Math.round(winH * 0.82);
    return Math.max(280, winH - keyboardOffset - 8);
  }, [keyboardOffset]);
  const resultsMaxHeight = useMemo(() => Math.max(160, cardMaxHeight - 188), [cardMaxHeight]);

  useEffect(() => {
    if (!visible) return;
    void prefetchQuranAyahSearch(getCurrentLocale());
  }, [visible]);

  const onPick = (surah: number, ayah: number) => {
    onOpenAyah(surah, ayah);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View
          style={[
            styles.card,
            {
              maxHeight: cardMaxHeight,
              paddingBottom: cardBottomPad,
              marginBottom: keyboardOffset,
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{kk.quran.ayahWordSearchTitle}</Text>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={kk.common.close}
            >
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>
          <View style={styles.body}>
            <QuranAyahWordSearch
              colors={colors}
              isDark={isDark}
              surahEnglishNames={surahEnglishNames}
              onOpenAyah={onPick}
              autoFocus={visible}
              listMaxHeight={resultsMaxHeight}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const screenBg = isDark ? colors.bg : "#F2F2F7";
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
      minHeight: 280,
      backgroundColor: screenBg,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
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
      minWidth: 0,
      color: colors.text,
      fontSize: 17,
      fontWeight: "800",
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
  });
}
