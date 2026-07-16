import React from "react";
import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../../i18n/kk";
import { getCurrentLocale, useAppLocale } from "../../i18n/runtime";
import { quranAyahMeaningForLocale } from "../../storage/quranSurahCache";
import { resolveQuranTranslitForDisplay } from "../../utils/quranTranslitDisplay";
import type { MushafBookPageStyles } from "../../quran/mushafBookPageStyles";
import type { MushafAyahRef, MushafBookAyah } from "../../quran/mushafBookTypes";
import { surahDisplayTitle } from "../../constants/surahTitleKk";
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
  useAppLocale();
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
        return (
          <View key={`${a.surahNumber}-${a.numberInSurah}-sec`} style={st.mushafSecondaryAyahBlock}>
            <Text style={st.mushafSecondaryAyahRibbon}>
              {surahDisplayTitle(a.surahNumber, "")} · {a.numberInSurah}
            </Text>
            {showReaderTranslit
              ? (() => {
                  const kiril = resolveQuranTranslitForDisplay(resolved.translit, resolved.text);
                  return kiril ? <Text style={st.mushafAyahKiril}>{kiril}</Text> : null;
                })()
              : null}
            {showReaderMeaning &&
            quranAyahMeaningForLocale({ ...resolved, surahNumber: a.surahNumber }, getCurrentLocale()) ? (
              <Text style={st.mushafAyahKk}>
                {quranAyahMeaningForLocale({ ...resolved, surahNumber: a.surahNumber }, getCurrentLocale())}
              </Text>
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
