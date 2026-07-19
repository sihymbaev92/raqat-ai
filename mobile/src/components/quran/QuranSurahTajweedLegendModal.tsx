import React from "react";
import { View, Text, Modal, ScrollView } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useI18n } from "../../i18n/useI18n";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { TAJWEED_RULES_CATALOG } from "../../content/tajweedRulesCatalog";
import type { ThemeColors } from "../../theme/colors";
import type { QuranSurahScreenStyles } from "../../quran/quranSurahScreenStyles";

export type QuranSurahTajweedLegendModalProps = {
  visible: boolean;
  styles: QuranSurahScreenStyles;
  colors: ThemeColors;
  isDark: boolean;
  onClose: () => void;
  onOpenGuide: () => void;
};

export function QuranSurahTajweedLegendModal({
  visible,
  styles,
  colors,
  isDark,
  onClose,
  onOpenGuide,
}: QuranSurahTajweedLegendModalProps) {
  const t = useI18n();
  const { tr } = useKkAutoTranslator();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.legendBackdrop}>
        <Pressable style={styles.legendDismiss} onPress={onClose} />
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>{t.quran.tajweedLegendTitle}</Text>
          <Text style={styles.legendIntro}>{t.quran.tajweedLegendIntro}</Text>
          <ScrollView style={styles.legendScroll} showsVerticalScrollIndicator={false}>
            {TAJWEED_RULES_CATALOG.map((meta) => (
              <View key={meta.rule} style={styles.legendLine}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: isDark ? meta.colorDark : meta.colorLight },
                  ]}
                />
                <View style={styles.legendTxtCol}>
                  <Text style={styles.legendRuleTitle}>
                    {tr(meta.labelKk)} <Text style={styles.legendTag}>{meta.tagOpen}</Text>
                  </Text>
                  <Text style={styles.legendTxtMultiline}>{tr(meta.detailKk)}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.legendFoot}>{t.quran.tajweedSourceNote}</Text>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.readerLegendBtn, pressed && { opacity: 0.9 }, { marginTop: 4 }]}
            onPress={onOpenGuide}
            accessibilityRole="button"
            accessibilityLabel={t.quran.tajweedOpenGuideA11y}
          >
            <MaterialIcons name="menu-book" size={22} color={colors.accent} />
            <Text style={styles.readerLegendBtnTxt}>{t.quran.tajweedOpenGuide}</Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.legendCloseBtn, pressed && { opacity: 0.88 }]}
            onPress={onClose}
          >
            <Text style={styles.legendCloseTxt}>{t.quran.tajweedLegendClose}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
