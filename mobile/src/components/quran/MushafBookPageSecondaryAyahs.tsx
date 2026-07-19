import React from "react";
import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../../i18n/kk";
import { useAppLocale } from "../../i18n/runtime";
import { useQuranReadingLocale } from "../../quran/quranReadingLocale";
import { useQuranTranslitScript } from "../../quran/quranTranslitScript";
import { quranAyahMeaningForLocale } from "../../storage/quranSurahCache";
import { resolveQuranTranslitForDisplay } from "../../utils/quranTranslitDisplay";
import type { MushafBookPageStyles } from "../../quran/mushafBookPageStyles";
import type { MushafAyahRef, MushafBookAyah } from "../../quran/mushafBookTypes";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { surahTitleForLocale } from "../../constants/surahTitleKk";
import { resolveMushafBookAyah } from "../../quran/buildMushafPagesGlobal";

type Props = {
  ayahs: MushafBookAyah[];
  styles: MushafBookPageStyles;
  showReaderMeaning: boolean;
  showReaderTranslit: boolean;
  playingRef: MushafAyahRef | null;
  ayahAudioIsPlaying: boolean;
  loadingAyahAudio: MushafAyahRef | null;
  accentColor: string;
  onToggleAudio: (ref: MushafAyahRef, item: MushafBookAyah) => void;
};

export function MushafBookPageSecondaryAyahs({
  ayahs,
  styles: st,
  showReaderMeaning,
  showReaderTranslit,
  playingRef,
  ayahAudioIsPlaying,
  loadingAyahAudio,
  accentColor,
  onToggleAudio,
}: Props) {
  const locale = useAppLocale();
  const readingLocale = useQuranReadingLocale();
  const translitScript = useQuranTranslitScript();
  const { tr } = useKkAutoTranslator();
  const hasFocusedAyah = ayahs.some(
    (a) =>
      (playingRef?.surah === a.surahNumber && playingRef.ayah === a.numberInSurah) ||
      (loadingAyahAudio?.surah === a.surahNumber && loadingAyahAudio.ayah === a.numberInSurah)
  );
  if (!showReaderMeaning && !showReaderTranslit && !hasFocusedAyah) return null;
  return (
    <>
      {ayahs.map((a) => {
        const resolved = resolveMushafBookAyah(a);
        const isLoad = loadingAyahAudio?.surah === a.surahNumber && loadingAyahAudio.ayah === a.numberInSurah;
        const hasLoaded = playingRef?.surah === a.surahNumber && playingRef.ayah === a.numberInSurah;
        const isPlayingNow = hasLoaded && ayahAudioIsPlaying;
        const isAudioFocus = hasLoaded || isLoad;
        if (!showReaderMeaning && !showReaderTranslit && !isAudioFocus) return null;
        const meaning = quranAyahMeaningForLocale(
          { ...resolved, surahNumber: a.surahNumber },
          readingLocale
        );
        return (
          <View key={`${a.surahNumber}-${a.numberInSurah}-sec`} style={st.mushafSecondaryAyahBlock}>
            <Text style={st.mushafSecondaryAyahRibbon}>
              {surahTitleForLocale(a.surahNumber, locale, { tr })} · {a.numberInSurah}
            </Text>
            {showReaderTranslit
              ? (() => {
                  const kiril = resolveQuranTranslitForDisplay(
                    resolved.translit,
                    resolved.text,
                    translitScript
                  );
                  return kiril ? <Text style={st.mushafAyahKiril}>{kiril}</Text> : null;
                })()
              : null}
            {showReaderMeaning && meaning ? (
              <Text style={st.mushafAyahKk}>{meaning}</Text>
            ) : null}
            {isAudioFocus ? (
              <Pressable
                oyuBackdrop={false}
                onPress={() => onToggleAudio({ surah: a.surahNumber, ayah: a.numberInSurah }, resolved)}
                disabled={isLoad}
                accessibilityRole="button"
                accessibilityState={{ busy: isLoad }}
                accessibilityLabel={
                  isLoad
                    ? kk.quran.ayahPlaySudaisA11y(a.numberInSurah)
                    : isPlayingNow
                      ? kk.quran.ayahPauseSudaisA11y(a.numberInSurah)
                      : kk.quran.ayahResumeSudaisA11y(a.numberInSurah)
                }
                style={({ pressed }) => [st.mushafInlineAudioControl, pressed && { opacity: 0.82 }]}
              >
                {isLoad ? null : (
                  <MaterialIcons name={isPlayingNow ? "pause" : "play-arrow"} size={18} color={accentColor} />
                )}
                <Text style={st.mushafInlineAudioText}>
                  {isLoad
                    ? kk.quran.ayahAudioLoadingAction
                    : isPlayingNow
                      ? kk.quran.ayahAudioPauseAction
                      : kk.quran.ayahAudioResumeAction}
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </>
  );
}
