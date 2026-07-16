import React, { useCallback, useState } from "react";
import { useAppLocale } from "../../i18n/runtime";
import { View, Text } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../../navigation/types";
import { navigateToHatim } from "../../navigation/navigateToMoreStack";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { MUSHAF_DENSITY_ORDER } from "../../config/mushafConfig";
import {
  QURAN_ARABIC_FONT_PRESETS,
} from "../../config/quranArabicFontPresets";
import {
  QURAN_RECITER_GROUP_ORDER,
  QURAN_RECITER_OPTIONS,
  quranReciterGroupLabelKk,
} from "../../config/quranReciters";
import {
  MUSHAF_TEXT_SCALE_MAX,
  MUSHAF_TEXT_SCALE_MIN,
  MUSHAF_TEXT_SCALE_STEP,
} from "../../quran/mushafTextScale";
import {
  loadQuranReaderPrefs,
  setAyahMarkerStyle,
  setMushafDensity,
  setQuranArabicFontPreset,
  setQuranArabicScriptEdition,
  setQuranMushafTextScale,
  setQuranReaderAllowRotation,
  setQuranReaderNavMode,
  setQuranReciterEdition,
  setQuranReadingTheme,
  setQuranTajweedColorsEnabled,
  type AyahMarkerStyleId,
  type MushafDensityId,
  type QuranReaderNavMode,
  type QuranReaderPrefsSnapshot,
} from "../../storage/quranReaderPrefs";
import {
  QURAN_READING_THEMES,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import {
  clearQuranLastReadPositions,
  setQuranLastReadEnabled,
} from "../../storage/quranLastRead";
import {
  loadQuranAudioDownloadDashboard,
  pauseQuranAudioDownloads,
  resetQuranAudioDownloadsAndCache,
  resumeQuranAudioDownloadsFromSettings,
  setQuranAudioAllowMobileData,
  setQuranAudioAutoDownloadEnabled,
} from "../../services/quranAudioDownloadManager";
import type { QuranAudioDownloadStatus } from "../../storage/quranAudioDownloadPrefs";
import { aggregateQuranAudioDownloadStatus } from "../../storage/quranAudioDownloadPrefs";
import { TOTAL_AYAHS } from "../../data/quranAyahCounts";
import { SettingsSection, SettingsCard, SettingsRow, makeSettingsStyles } from "./settingsUi";
import {
  SettingsAccordion,
  SettingsBoolRow,
  SettingsChipGroup,
  SettingsChoiceRow,
  SettingsScaleStepper,
} from "./settingsFormUi";

type Props = { colors: ThemeColors };
type QuranAudioDashboard = Awaited<ReturnType<typeof loadQuranAudioDownloadDashboard>>;

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1);
}

function quranAudioStatusLabel(status: QuranAudioDownloadStatus): string {
  switch (status) {
    case "running":
      return kk.settings.quranAudioStatusRunning;
    case "paused":
      return kk.settings.quranAudioStatusPaused;
    case "blocked":
      return kk.settings.quranAudioStatusBlocked;
    case "complete":
      return kk.settings.quranAudioStatusComplete;
    case "error":
      return kk.settings.quranAudioStatusError;
    default:
      return kk.settings.quranAudioStatusIdle;
  }
}

export function SettingsQuranHub({ colors }: Props) {
  useAppLocale();
  const styles = makeSettingsStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [prefs, setPrefs] = useState<QuranReaderPrefsSnapshot | null>(null);
  const [audioDash, setAudioDash] = useState<QuranAudioDashboard | null>(null);

  const reload = useCallback(async () => {
    setPrefs(await loadQuranReaderPrefs());
  }, []);

  const reloadAudio = useCallback(async () => {
    setAudioDash(await loadQuranAudioDownloadDashboard());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const run = async () => {
        const next = await loadQuranAudioDownloadDashboard();
        if (alive) setAudioDash(next);
      };
      void run();
      const timer = setInterval(() => void run(), 2500);
      return () => {
        alive = false;
        clearInterval(timer);
      };
    }, [])
  );

  if (!prefs) return null;

  const patch = (partial: Partial<QuranReaderPrefsSnapshot>) => {
    setPrefs((p) => (p ? { ...p, ...partial } : p));
  };

  const mushafPct = Math.round(prefs.mushafTextScale * 100);
  const audioState = audioDash?.state;
  const audioPrefs = audioDash?.prefs;
  const activeEdition = audioState?.currentEdition ?? prefs.reciterEdition;
  const editionState = activeEdition ? audioState?.editions[activeEdition] : undefined;
  const audioDone = editionState?.cursorIndex ?? 0;
  const audioTotal = TOTAL_AYAHS;
  const aggregateStatus =
    audioDash?.aggregateStatus ??
    (audioPrefs && audioState
      ? aggregateQuranAudioDownloadStatus(audioPrefs, audioState)
      : "idle");
  const audioStatus = quranAudioStatusLabel(aggregateStatus);

  return (
    <>
      <SettingsSection
        colors={colors}
        title={kk.settings.quranSectionReading}
        subtitle={kk.settings.quranSectionReadingSub}
      >
        <SettingsCard colors={colors}>
          <SettingsBoolRow
            colors={colors}
            label={kk.settings.quranReadLastPos}
            hint={kk.settings.quranReadLastPosHint}
            value={prefs.lastRead}
            onChange={(v) => {
              patch({ lastRead: v });
              void setQuranLastReadEnabled(v);
            }}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        colors={colors}
        title={kk.settings.quranSectionMushaf}
        subtitle={kk.settings.quranSectionMushafSub}
      >
        <Text style={[styles.label, { marginBottom: 6 }]}>{kk.quran.readerReadingThemeTitle}</Text>
        <SettingsChipGroup
          colors={colors}
          options={QURAN_READING_THEMES.map((t) => t.id)}
          value={prefs.readingTheme}
          onChange={(id: QuranReadingThemeId) => {
            patch({ readingTheme: id });
            void setQuranReadingTheme(id);
          }}
          labelFor={(id) => QURAN_READING_THEMES.find((t) => t.id === id)?.labelKk ?? id}
        />
        <Text style={[styles.hint, { marginBottom: 10 }]}>{kk.quran.readerReadingThemeHint}</Text>
        <Text style={[styles.label, { marginBottom: 6 }]}>{kk.settings.quranMushafDensityTitle}</Text>
        <SettingsChipGroup
          colors={colors}
          options={MUSHAF_DENSITY_ORDER}
          value={prefs.density}
          onChange={(id: MushafDensityId) => {
            patch({ density: id });
            void setMushafDensity(id);
          }}
          labelFor={(id) => kk.settings.quranMushafDensityOption(id)}
        />
        <Text style={[styles.label, { marginTop: 10, marginBottom: 6 }]}>{kk.quran.readerNavTitle}</Text>
        <SettingsChipGroup
          colors={colors}
          options={["scroll", "page"] as const}
          value={prefs.navMode}
          onChange={(id: QuranReaderNavMode) => {
            patch({ navMode: id });
            void setQuranReaderNavMode(id);
          }}
          labelFor={(id) =>
            id === "scroll" ? kk.settings.quranReaderNavScrollShort : kk.settings.quranReaderNavPageShort
          }
        />
        <Text style={[styles.label, { marginTop: 10, marginBottom: 6 }]}>{kk.quran.readerAyahMarkerStyleTitle}</Text>
        <SettingsChipGroup
          colors={colors}
          options={["ring_svg", "classic"] as const}
          value={prefs.marker}
          onChange={(id: AyahMarkerStyleId) => {
            patch({ marker: id });
            void setAyahMarkerStyle(id);
          }}
          labelFor={(id) =>
            id === "ring_svg" ? kk.settings.quranReaderMarkerRing : kk.settings.quranReaderMarkerClassic
          }
        />
        <Text style={[styles.label, { marginTop: 10, marginBottom: 6 }]}>{kk.quran.readerMushafScaleTitle}</Text>
        <SettingsScaleStepper
          colors={colors}
          valuePct={mushafPct}
          decreaseDisabled={prefs.mushafTextScale <= MUSHAF_TEXT_SCALE_MIN + 1e-6}
          increaseDisabled={prefs.mushafTextScale >= MUSHAF_TEXT_SCALE_MAX - 1e-6}
          decreaseA11y={kk.quran.readerMushafScaleSmallerA11y}
          increaseA11y={kk.quran.readerMushafScaleLargerA11y}
          valueA11y={kk.quran.readerMushafScaleValueA11y(mushafPct)}
          onDecrease={() => {
            const next = prefs.mushafTextScale - MUSHAF_TEXT_SCALE_STEP;
            patch({ mushafTextScale: next });
            void setQuranMushafTextScale(next);
          }}
          onIncrease={() => {
            const next = prefs.mushafTextScale + MUSHAF_TEXT_SCALE_STEP;
            patch({ mushafTextScale: next });
            void setQuranMushafTextScale(next);
          }}
        />
        <View style={{ marginTop: 8 }}>
          <SettingsBoolRow
            colors={colors}
            label={kk.settings.quranAllowRotation}
            hint={kk.settings.quranAllowRotationHint}
            value={prefs.allowRotation}
            onChange={(v) => {
              patch({ allowRotation: v });
              void setQuranReaderAllowRotation(v);
            }}
          />
        </View>
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.quranSectionArabic} subtitle={kk.settings.quranSectionArabicSub}>
        <SettingsAccordion colors={colors} title={kk.quran.readerArabicScriptTitle} defaultOpen>
          <Text style={styles.hint}>{kk.quran.readerArabicScriptHint}</Text>
          {(
            [
              { id: "madinah" as const, label: kk.quran.readerArabicScriptMadinah },
              { id: "turkish" as const, label: kk.quran.readerArabicScriptTurkish },
            ] as const
          ).map((opt) => (
            <SettingsChoiceRow
              key={opt.id}
              colors={colors}
              label={opt.label}
              selected={prefs.arabicScript === opt.id}
              onPress={() => {
                patch({ arabicScript: opt.id });
                void setQuranArabicScriptEdition(opt.id);
              }}
            />
          ))}
        </SettingsAccordion>
        <SettingsAccordion colors={colors} title={kk.quran.readerArabicFontTitle}>
          <Text style={styles.hint}>{kk.quran.readerArabicFontHint}</Text>
          {QURAN_ARABIC_FONT_PRESETS.map((p) => (
            <SettingsChoiceRow
              key={p.id}
              colors={colors}
              label={p.labelKk}
              selected={prefs.arabicFont === p.id}
              onPress={() => {
                patch({ arabicFont: p.id });
                void setQuranArabicFontPreset(p.id);
              }}
            />
          ))}
        </SettingsAccordion>
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.quranSectionAudio} subtitle={kk.settings.quranSectionAudioSub}>
        <SettingsAccordion colors={colors} title={kk.quran.readerReciterTitle}>
          <Text style={styles.hint}>{kk.quran.readerReciterHint}</Text>
          {QURAN_RECITER_GROUP_ORDER.map((group) => {
            const items = QURAN_RECITER_OPTIONS.filter((r) => r.group === group);
            if (!items.length) return null;
            return (
              <View key={group}>
                <Text style={[styles.label, { marginTop: 8, fontSize: 13, color: colors.muted }]}>
                  {quranReciterGroupLabelKk(group)}
                </Text>
                {items.map((r) => {
                  const available = r.audioAvailable !== false;
                  const label = available
                    ? r.labelKk
                    : `${r.labelKk} (${kk.quran.readerReciterSoon})`;
                  return (
                    <SettingsChoiceRow
                      key={r.edition}
                      colors={colors}
                      label={label}
                      selected={prefs.reciterEdition === r.edition}
                      disabled={!available}
                      accessibilityLabel={
                        available ? label : kk.quran.readerReciterUnavailableA11y(r.labelKk)
                      }
                      onPress={() => {
                        if (!available) return;
                        patch({ reciterEdition: r.edition });
                        void setQuranReciterEdition(r.edition);
                      }}
                    />
                  );
                })}
              </View>
            );
          })}
        </SettingsAccordion>
        <SettingsCard colors={colors} panel>
          <Text style={styles.label}>{kk.settings.quranAudioOfflineTitle}</Text>
          <Text style={[styles.hint, { marginTop: 4 }]}>{kk.settings.quranAudioOfflineSub}</Text>
          <SettingsBoolRow
            colors={colors}
            label={kk.settings.quranAudioAutoDownload}
            hint={kk.settings.quranAudioAutoDownloadHint}
            value={!audioPrefs?.paused}
            onChange={(v) => {
              void setQuranAudioAutoDownloadEnabled(v).then((snap) => {
                setAudioDash((prev) => ({
                  ...(prev ?? { cacheFiles: 0, cacheBytes: 0, aggregateStatus: "idle" as const }),
                  ...snap,
                  aggregateStatus: aggregateQuranAudioDownloadStatus(snap.prefs, snap.state),
                  cacheFiles: prev?.cacheFiles ?? 0,
                  cacheBytes: prev?.cacheBytes ?? 0,
                }));
                void reloadAudio();
              });
            }}
          />
          <SettingsBoolRow
            colors={colors}
            label={kk.settings.quranAudioAllowMobileData}
            hint={kk.settings.quranAudioAllowMobileDataHint}
            value={audioPrefs?.allowMobileData ?? false}
            disabled={audioPrefs?.paused ?? false}
            onChange={(v) => {
              void setQuranAudioAllowMobileData(v).then((snap) => {
                setAudioDash((prev) => ({
                  ...(prev ?? { cacheFiles: 0, cacheBytes: 0, aggregateStatus: "idle" as const }),
                  ...snap,
                  aggregateStatus: aggregateQuranAudioDownloadStatus(snap.prefs, snap.state),
                  cacheFiles: prev?.cacheFiles ?? 0,
                  cacheBytes: prev?.cacheBytes ?? 0,
                }));
                void reloadAudio();
              });
            }}
          />
          <SettingsRow
            colors={colors}
            label={kk.settings.quranAudioStatus}
            value={`${audioStatus} · ${kk.settings.quranAudioProgress(audioDone, audioTotal, mb(audioDash?.cacheBytes ?? editionState?.bytes ?? 0))}`}
          />
          <Text style={styles.hint}>
            {kk.settings.quranAudioCacheStats(audioDash?.cacheFiles ?? 0, mb(audioDash?.cacheBytes ?? 0))}
          </Text>
          {audioState?.currentLabel ? (
            <Text style={styles.hint}>{kk.settings.quranAudioCurrent(audioState.currentLabel)}</Text>
          ) : null}
          {editionState?.lastError ? <Text style={styles.hint}>{editionState.lastError}</Text> : null}
          <SettingsRow
            colors={colors}
            label={audioPrefs?.paused || aggregateStatus !== "running" ? kk.settings.quranAudioResume : kk.settings.quranAudioPause}
            onPress={() => {
              const action =
                audioPrefs?.paused || aggregateStatus !== "running"
                  ? resumeQuranAudioDownloadsFromSettings()
                  : pauseQuranAudioDownloads();
              void action.then((snap) => {
                setAudioDash((prev) => ({
                  ...(prev ?? { cacheFiles: 0, cacheBytes: 0, aggregateStatus: "idle" as const }),
                  ...snap,
                  aggregateStatus: aggregateQuranAudioDownloadStatus(snap.prefs, snap.state),
                  cacheFiles: prev?.cacheFiles ?? 0,
                  cacheBytes: prev?.cacheBytes ?? 0,
                }));
                void reloadAudio();
              });
            }}
          />
          <SettingsRow
            colors={colors}
            label={kk.settings.quranAudioClear}
            onPress={() => {
              void resetQuranAudioDownloadsAndCache().then((snap) => {
                setAudioDash({
                  ...snap,
                  cacheFiles: 0,
                  cacheBytes: 0,
                  aggregateStatus: aggregateQuranAudioDownloadStatus(snap.prefs, snap.state),
                });
                void reloadAudio();
              });
            }}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.quranSectionTajweed} subtitle={kk.settings.quranSectionTajweedSub}>
        <SettingsCard colors={colors}>
          <SettingsBoolRow
            colors={colors}
            label={kk.quran.tajweedModeLabel}
            hint={kk.quran.tajweedModeHint}
            value={prefs.tajweedColors}
            onChange={(v) => {
              patch({ tajweedColors: v });
              void setQuranTajweedColorsEnabled(v);
            }}
          />
        </SettingsCard>
        <SettingsRow
          colors={colors}
          label={kk.quran.tajweedOpenGuide}
          onPress={() => navigation.navigate("TajweedGuide")}
        />
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.quranSectionShortcuts} subtitle={kk.settings.quranSectionShortcutsSub}>
        <SettingsCard colors={colors}>
          <SettingsRow colors={colors} label={kk.settings.openQuranList} onPress={() => navigation.navigate("QuranList")} />
          <SettingsRow colors={colors} label={kk.features.hatimTitle} onPress={() => navigateToHatim(navigation)} />
          <SettingsRow
            colors={colors}
            label={kk.settings.quranReadClear}
            onPress={() => void clearQuranLastReadPositions()}
          />
        </SettingsCard>
        <Text style={styles.hint}>{kk.settings.quranReadClearHint}</Text>
        <Text style={styles.hint}>{kk.settings.quranReaderInSurahNote}</Text>
      </SettingsSection>
    </>
  );
}
