import React from "react";
import { View, Text, Modal, ScrollView } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppLocale } from "../../i18n/runtime";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { useI18n } from "../../i18n/useI18n";
import { surahTitleForLocale } from "../../constants/surahTitleKk";
import { QURAN_JUZ_STARTS, type QuranJuzStart } from "../../data/quranJuzBoundaries";
import type { ThemeColors } from "../../theme/colors";
import type { QuranSurahScreenStyles } from "../../quran/quranSurahScreenStyles";

export type QuranSurahJuzPickerSheetProps = {
  visible: boolean;
  windowHeight: number;
  readerJuzFromAnchor: number;
  styles: QuranSurahScreenStyles;
  colors: ThemeColors;
  onClose: () => void;
  onPickJuz: (row: QuranJuzStart) => void;
};

export function QuranSurahJuzPickerSheet({
  visible,
  windowHeight,
  readerJuzFromAnchor,
  styles,
  colors,
  onClose,
  onPickJuz,
}: QuranSurahJuzPickerSheetProps) {
  const t = useI18n();
  const locale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.readerSettingsRoot}>
        <Pressable style={styles.readerSettingsBackdrop} onPress={onClose} />
        <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
          <View style={styles.readerSettingsHandle} />
          <Text style={styles.readerSettingsTitle}>{t.quran.juzPickerSheetTitle}</Text>
          <ScrollView
            style={{ maxHeight: Math.min(480, windowHeight * 0.62) }}
            contentContainerStyle={styles.readerSettingsScrollPad}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {QURAN_JUZ_STARTS.map((row) => {
              const surahTitle = surahTitleForLocale(row.startSurah, locale, { tr });
              const isCurrentJuz = row.juz === readerJuzFromAnchor;
              return (
                <Pressable
                  key={row.juz}
                  style={({ pressed }) => [
                    styles.juzPickerRow,
                    isCurrentJuz && styles.readerChoiceRowSelected,
                    pressed && { opacity: 0.88 },
                  ]}
                  onPress={() => onPickJuz(row)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.quran.juzTitle(row.juz)}. ${t.quran.juzStartsAtLine(surahTitle, row.startAyah)}`}
                >
                  <View style={styles.juzPickerRowTextCol}>
                    <Text style={styles.juzPickerRowTitle}>{t.quran.juzTitle(row.juz)}</Text>
                    <Text style={styles.juzPickerRowSub} numberOfLines={2}>
                      {t.quran.juzStartsAtLine(surahTitle, row.startAyah)}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.readerSettingsDoneBtn, pressed && { opacity: 0.92 }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.common.done}
          >
            <Text style={styles.readerSettingsDoneTxt}>{t.common.done}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
