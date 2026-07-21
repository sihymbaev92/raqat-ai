import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImageBackground, Platform, ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import type { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import type { PrayerNotifSoundId } from "../storage/prefs";
import {
  peekAzanDuaFullyFinished,
  playAzanDuaAudio,
  previewPrayerNotifSound,
  stopPreviewPrayerNotifSound,
} from "../utils/previewPrayerNotifSound";
import {
  activeAzanTextIndexFromPlayback,
  azanDuaBlockIndex,
} from "../services/azanTextKaraoke";
import { readAzanDuaPlaybackStatus, readAzanPlaybackStatus } from "../services/azanPlaybackSync";
import {
  finishAzanDelivery,
  getNativeAzanPlaybackStatus,
  playNativePrayerAzanAudio,
  playNativePrayerAzanDuaAudio,
  prayerEnteredTitleForSlot,
  stopNativePrayerAzanAudio,
  suppressAzanHeadsUpBanner,
} from "../services/prayerFullScreenAzan";

type Props = NativeStackScreenProps<RootStackParamList, "PrayerAzan">;

const AZAN_BACKGROUND = require("../../assets/namaz/azan-background-generated.webp");
const KARAOKE_POLL_MS = 180;

const PRAYER_AZAN_SOUND_IDS = new Set<PrayerNotifSoundId>(["off", "adhan_haramain"]);

type AzanTextBlock = {
  id: string;
  arabic: string;
  translit: string;
  meaning: string;
  repeat?: string;
};

const AZAN_TEXT_BASE_DURATIONS_MS: Record<string, number> = {
  "takbir-open": 22_000,
  "shahada-tawhid": 20_000,
  "shahada-risala": 20_000,
  "hayya-salah": 17_000,
  "hayya-falah": 17_000,
  "fajr-extra": 17_000,
  "takbir-close": 13_000,
  tahlil: 18_000,
  "azan-dua": 16_500,
};

export function azanTextBlockDurationMs(block: Pick<AzanTextBlock, "id" | "repeat">): number {
  return AZAN_TEXT_BASE_DURATIONS_MS[block.id] ?? (block.repeat ? 16_000 : 14_000);
}

export function buildAzanTextSchedule(blocks: readonly Pick<AzanTextBlock, "id" | "repeat">[]): number[] {
  const starts: number[] = [];
  let elapsed = 0;
  blocks.forEach((block) => {
    starts.push(elapsed);
    elapsed += azanTextBlockDurationMs(block);
  });
  return starts;
}

export function buildAzanTextBlocks(salatKey?: string): AzanTextBlock[] {
  const azanTextBlocks = kk.prayer.azanTextBlocks as AzanTextBlock[];
  const fajrAzanBlock = kk.prayer.fajrAzanTextBlock as AzanTextBlock;
  const azanDuaBlock = kk.prayer.azanDuaTextBlock as AzanTextBlock;
  const base =
    salatKey === "fajr"
      ? [
          ...azanTextBlocks.slice(0, 5),
          fajrAzanBlock,
          ...azanTextBlocks.slice(5),
        ]
      : azanTextBlocks;
  return [...base, azanDuaBlock];
}

export function normalizePrayerAzanSoundId(raw: unknown): PrayerNotifSoundId {
  return typeof raw === "string" && PRAYER_AZAN_SOUND_IDS.has(raw as PrayerNotifSoundId)
    ? (raw as PrayerNotifSoundId)
    : "adhan_haramain";
}

export function prayerAzanKickerForLabel(label: string): string {
  return prayerEnteredTitleForSlot(label);
}

export function shouldAutoStartPrayerAzanAudio(isNativeAudio: boolean, soundId: PrayerNotifSoundId): boolean {
  return !isNativeAudio && soundId !== "off";
}

export function closePrayerAzanScreen(
  navigation: NativeStackNavigationProp<RootStackParamList, "PrayerAzan">
): void {
  finishAzanDelivery();
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  navigation.reset({
    index: 0,
    routes: [{ name: "Main", params: { screen: "Home" } }],
  });
}

function azanPlaybackFinished(
  status: { positionMs: number; durationMs: number; isPlaying: boolean; completed?: boolean } | null
): boolean {
  if (!status) return false;
  if (status.completed === true && !status.isPlaying) return true;
  if (status.durationMs <= 0) return false;
  if (status.isPlaying) return false;
  return status.positionMs >= status.durationMs - 400;
}

/** Азан + бата толық біткеннен кейін экранды жабу. */
export function shouldClosePrayerAzanAfterFullPlayback(opts: {
  stopped: boolean;
  soundOff: boolean;
  duaStarted: boolean;
  sessionFullyFinished: boolean;
  duaJsFullyFinished: boolean;
  duaStatusPlaying: boolean;
}): boolean {
  if (opts.stopped || opts.soundOff) return false;
  if (opts.sessionFullyFinished) return true;
  if (opts.duaStarted && opts.duaJsFullyFinished && !opts.duaStatusPlaying) return true;
  return false;
}

export function PrayerAzanScreen({ route, navigation }: Props) {
  const { isDark } = useAppTheme();
  const locale = useAppLocale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(isDark), [isDark]);
  const label = (route.params?.label || kk.prayer.azanScreenDefaultLabel).trim();
  const salatKey = (route.params?.salatKey || "").trim();
  const time = (route.params?.time || "").trim();
  const soundId = normalizePrayerAzanSoundId(route.params?.soundId);
  const useNativeAzan = Platform.OS !== "web" && soundId !== "off";
  const isNativeAudio = route.params?.nativeAudio === "1";
  const [stopped, setStopped] = useState(false);
  const azanTextBlocks = useMemo(() => buildAzanTextBlocks(salatKey), [locale, salatKey]);
  const [activeTextIdx, setActiveTextIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const lineOffsetsRef = useRef<number[]>([]);
  const duaStartedRef = useRef(false);
  const closingRef = useRef(false);

  useEffect(() => {
    setStopped(false);
    setActiveTextIdx(0);
    duaStartedRef.current = false;
    closingRef.current = false;
    lineOffsetsRef.current = [];
    // Төбедегі «Выключить / Открыть» heads-up баннерді жасыру — толық экран беті қалады.
    suppressAzanHeadsUpBanner();
    if (soundId !== "off") {
      if (useNativeAzan) {
        // Delivery may already be playing; if idle, start now (iOS AlarmKit open path).
        void getNativeAzanPlaybackStatus().then((st) => {
          if (st?.isPlaying || st?.completed || st?.isDua) return;
          playNativePrayerAzanAudio(soundId);
        });
      } else if (!isNativeAudio) {
        void previewPrayerNotifSound(soundId);
      }
    }
    return () => {
      void stopPreviewPrayerNotifSound();
      // Native alarm already owns playback; remount (locale / nav reset) must not kill it.
      if (!isNativeAudio) stopNativePrayerAzanAudio();
    };
  }, [isNativeAudio, soundId, useNativeAzan]);

  useEffect(() => {
    if (stopped || soundId === "off") return undefined;

    const duaIdx = azanDuaBlockIndex(azanTextBlocks);
    let cancelled = false;

    const closeFully = () => {
      if (cancelled || closingRef.current) return;
      closingRef.current = true;
      setStopped(true);
      closePrayerAzanScreen(navigation);
    };

    const tick = async () => {
      if (cancelled || closingRef.current) return;

      const azanStatus = await readAzanPlaybackStatus(useNativeAzan);
      if (
        shouldClosePrayerAzanAfterFullPlayback({
          stopped: false,
          soundOff: false,
          duaStarted: duaStartedRef.current,
          sessionFullyFinished: azanStatus?.fullyFinished === true,
          duaJsFullyFinished: peekAzanDuaFullyFinished(),
          duaStatusPlaying: false,
        })
      ) {
        closeFully();
        return;
      }

      const duaStatus = await readAzanDuaPlaybackStatus(useNativeAzan);
      if (duaStatus?.isPlaying || duaStatus?.isDua) {
        if (duaIdx >= 0) setActiveTextIdx(duaIdx);
        return;
      }

      if (
        shouldClosePrayerAzanAfterFullPlayback({
          stopped: false,
          soundOff: false,
          duaStarted: duaStartedRef.current,
          sessionFullyFinished: azanStatus?.fullyFinished === true,
          duaJsFullyFinished: peekAzanDuaFullyFinished(),
          duaStatusPlaying: duaStatus?.isPlaying === true,
        })
      ) {
        closeFully();
        return;
      }

      if (azanPlaybackFinished(azanStatus)) {
        if (duaIdx >= 0) setActiveTextIdx(duaIdx);
        if (!duaStartedRef.current) {
          duaStartedRef.current = true;
          if (useNativeAzan) {
            const nativeStatus = await getNativeAzanPlaybackStatus();
            if (!nativeStatus?.isDua && !nativeStatus?.isPlaying) {
              playNativePrayerAzanDuaAudio();
            }
          } else {
            void playAzanDuaAudio();
          }
        }
        return;
      }

      if (azanStatus && azanStatus.durationMs > 0) {
        const nextIdx = activeAzanTextIndexFromPlayback(
          azanTextBlocks,
          azanStatus.positionMs,
          azanStatus.durationMs,
          azanStatus.isPlaying
        );
        setActiveTextIdx(nextIdx);
      }
    };

    void tick();
    const timer = setInterval(() => {
      void tick();
    }, KARAOKE_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [azanTextBlocks, navigation, soundId, stopped, useNativeAzan]);

  useEffect(() => {
    const y = lineOffsetsRef.current[activeTextIdx];
    if (typeof y !== "number") return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  }, [activeTextIdx]);

  const stop = async () => {
    await stopPreviewPrayerNotifSound();
    setStopped(true);
    closePrayerAzanScreen(navigation);
  };

  return (
    <ImageBackground source={AZAN_BACKGROUND} resizeMode="cover" testID="screen-prayer-azan" style={styles.root}>
      <View style={styles.overlay} />
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 18) + 8 }]}>
        <View style={styles.center}>
          <Text style={styles.title}>{label}</Text>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>

        <View style={styles.textPanel}>
          <Text style={styles.textPanelTitle}>{kk.prayer.azanTextPanelTitle}</Text>
          <ScrollView
            ref={scrollRef}
            style={styles.textScroll}
            contentContainerStyle={styles.textScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {azanTextBlocks.map((block, idx) => {
              const active = idx === activeTextIdx;
              return (
                <View
                  key={block.id}
                  onLayout={(e) => {
                    lineOffsetsRef.current[idx] = e.nativeEvent.layout.y;
                  }}
                  style={[styles.azanLine, active && styles.azanLineActive]}
                >
                  <View style={styles.azanLineTop}>
                    <Text style={[styles.azanArabic, active && styles.azanArabicActive]}>
                      {block.arabic}
                    </Text>
                    {block.repeat ? <Text style={styles.repeatBadge}>{block.repeat}</Text> : null}
                  </View>
                  <Text style={[styles.azanTranslit, active && styles.azanTranslitActive]}>
                    {block.translit}
                  </Text>
                  <Text style={styles.azanMeaning}>{block.meaning}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <Pressable
          onPress={stop}
          disabled={stopped}
          accessibilityRole="button"
          accessibilityLabel={kk.prayer.azanScreenStop}
          style={({ pressed }) => [
            styles.stopBtn,
            { marginBottom: Math.max(insets.bottom, 18) },
            (pressed || stopped) && { opacity: stopped ? 0.62 : 0.86 },
          ]}
        >
          <MaterialIcons name="stop-circle" size={24} color="#fff" />
          <Text style={styles.stopTxt}>{stopped ? kk.prayer.azanScreenStopped : kk.prayer.azanScreenStop}</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

function makeStyles(isDark: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: "#061016",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(2, 8, 11, 0.70)" : "rgba(3, 18, 24, 0.62)",
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: "space-between",
      gap: 12,
    },
    center: {
      alignItems: "center",
      gap: 8,
      padding: 20,
      borderRadius: 36,
      backgroundColor: "rgba(0,0,0,0.24)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
    },
    title: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", textAlign: "center" },
    time: { color: "#F6D98C", fontSize: 46, fontWeight: "900", letterSpacing: 0.6 },
    textPanel: {
      flex: 1,
      minHeight: 0,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "rgba(246,217,140,0.24)",
      backgroundColor: "rgba(0,0,0,0.28)",
      padding: 12,
    },
    textPanelTitle: {
      color: "#FFF5D4",
      fontSize: 14,
      fontWeight: "900",
      marginBottom: 8,
      textAlign: "center",
    },
    textScroll: {
      flex: 1,
    },
    textScrollContent: {
      gap: 8,
      paddingBottom: 4,
    },
    azanLine: {
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.09)",
    },
    azanLineActive: {
      backgroundColor: "rgba(246,217,140,0.16)",
      borderColor: "rgba(246,217,140,0.46)",
    },
    azanLineTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    azanArabic: {
      flex: 1,
      color: "rgba(255,255,255,0.9)",
      fontSize: 21,
      lineHeight: 34,
      fontWeight: "900",
      textAlign: "right",
    },
    azanArabicActive: {
      color: "#FFFFFF",
      fontSize: 24,
    },
    repeatBadge: {
      overflow: "hidden",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: "rgba(246,217,140,0.18)",
      color: "#F6D98C",
      fontSize: 11,
      fontWeight: "900",
    },
    azanTranslit: {
      marginTop: 3,
      color: "#F6D98C",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "900",
    },
    azanTranslitActive: {
      color: "#FFE8A8",
      fontSize: 16,
    },
    azanMeaning: {
      marginTop: 2,
      color: "rgba(255,255,255,0.68)",
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
    },
    stopBtn: {
      minHeight: 62,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 10,
      backgroundColor: "#B42318",
      shadowColor: "#000",
      shadowOpacity: 0.24,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
    stopTxt: { color: "#fff", fontSize: 18, fontWeight: "900" },
  });
}
