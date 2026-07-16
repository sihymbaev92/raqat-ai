import React, { useMemo } from "react";
import { View, Text, Modal, ScrollView } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { kk } from "../../i18n/kk";
import {
  displayCachedAyahArabic,
  type CachedAyah,
} from "../../storage/quranSurahCache";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import { getQuranTranslitOverride } from "../../content/quranTranslitOverrides";
import { resolveQuranTranslitForDisplay } from "../../utils/quranTranslitDisplay";
import type { QuranSurahScreenStyles } from "../../quran/quranSurahScreenStyles";

export type QuranSurahTranslationSheetProps = {
  visible: boolean;
  item: CachedAyah | null;
  surahNumber: number;
  arabicScriptEdition: QuranArabicScriptEditionId;
  windowHeight: number;
  styles: QuranSurahScreenStyles;
  ayahMeaningLine: (item: CachedAyah) => string;
  onClose: () => void;
};

export function QuranSurahTranslationSheet({
  visible,
  item,
  surahNumber,
  arabicScriptEdition,
  windowHeight,
  styles,
  ayahMeaningLine,
  onClose,
}: QuranSurahTranslationSheetProps) {
  const insets = useSafeAreaInsets();
  const content = useMemo(() => {
    if (!item) return null;
    const ar = displayCachedAyahArabic(item, arabicScriptEdition);
    const kkLine = ayahMeaningLine(item);
    const kirilRead =
      getQuranTranslitOverride(surahNumber, item.numberInSurah) ??
      resolveQuranTranslitForDisplay(item.translit, displayCachedAyahArabic(item, arabicScriptEdition));
    return (
      <>
        <Text style={styles.readerSettingsTitle}>
          {kk.quran.ayahTranslationSheetTitle(surahNumber, item.numberInSurah)}
        </Text>
        <ScrollView
          style={{ maxHeight: Math.min(520, windowHeight * 0.62) }}
          contentContainerStyle={styles.translationSheetContent}
          showsVerticalScrollIndicator
        >
          <Text style={styles.translationSectionTitle}>{kk.quran.ayahTranslationArabic}</Text>
          <Text selectable style={styles.translationArabicText}>
            {ar}
          </Text>
          {kirilRead ? (
            <>
              <Text style={styles.translationSectionTitle}>{kk.quran.ayahTranslationReading}</Text>
              <Text selectable style={styles.translationBodyText}>
                {kirilRead}
              </Text>
            </>
          ) : null}
          <Text style={styles.translationSectionTitle}>{kk.quran.ayahTranslationMeaning}</Text>
          <Text selectable style={styles.translationBodyText}>
            {kkLine || kk.quran.ayahTranslationMissing}
          </Text>
          <Text style={styles.translationSectionTitle}>{kk.quran.ayahTranslationTafsir}</Text>
          <Text selectable style={styles.translationTafsirText}>
            {kk.quran.ayahTranslationTafsirBody}
          </Text>
        </ScrollView>
        <Pressable
          style={({ pressed }) => [
            styles.readerSettingsDoneBtn,
            { alignItems: "center", marginHorizontal: 4, marginTop: 12 },
            pressed && { opacity: 0.92 },
          ]}
          onPress={onClose}
        >
          <Text style={styles.readerSettingsDoneTxt}>{kk.common.close}</Text>
        </Pressable>
      </>
    );
  }, [arabicScriptEdition, ayahMeaningLine, item, onClose, styles, surahNumber, windowHeight]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.readerSettingsRoot}>
        <Pressable style={styles.readerSettingsBackdrop} onPress={onClose} />
        <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
          <View style={styles.readerSettingsHandle} />
          {content}
        </View>
      </View>
    </Modal>
  );
}
