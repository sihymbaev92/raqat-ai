import React, { useCallback, useState } from "react";
import { useAppLocale } from "../../i18n/runtime";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { View, Text } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../../navigation/types";
import { navigateToHatim } from "../../navigation/navigateToMoreStack";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import {
  QURAN_RECITER_GROUP_ORDER,
  QURAN_RECITER_OPTIONS,
  quranReciterGroupLabelKk,
} from "../../config/quranReciters";
import {
  QURAN_READING_LOCALES,
  setQuranReadingLocale,
  useQuranReadingLocale,
  type QuranReadingLocale,
} from "../../quran/quranReadingLocale";
import { quranTranslationLocaleChoiceLabel } from "../../quran/quranTranslationLocaleOptions";
import {
  QURAN_TRANSLIT_SCRIPTS,
  setQuranTranslitScript,
  useQuranTranslitScript,
  type QuranTranslitScript,
} from "../../quran/quranTranslitScript";
import {
  loadQuranReaderPrefs,
  setQuranArabicScriptEdition,
  setQuranReaderAllowRotation,
  setQuranReciterEdition,
  setQuranReadingTheme,
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
  const readingLocale = useQuranReadingLocale();
  const translitScript = useQuranTranslitScript();
  const { tr } = useKkAutoTranslator();
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
        <Text style={[styles.label, { marginTop: 12, marginBottom: 6 }]}>
          {kk.settings.quranTranslationLocaleTitle}
        </Text>
        <SettingsChipGroup
          colors={colors}
          options={QURAN_READING_LOCALES}
          value={readingLocale}
          onChange={(id: QuranReadingLocale) => {
            void setQuranReadingLocale(id);
          }}
          labelFor={(id) => quranTranslationLocaleChoiceLabel(id)}
        />
        <Text style={[styles.hint, { marginBottom: 10 }]}>{kk.settings.quranTranslationLocaleHint}</Text>
        <Text style={[styles.label, { marginBottom: 6 }]}>{kk.settings.quranTranslitScriptTitle}</Text>
        <SettingsChipGroup
          colors={colors}
          options={QURAN_TRANSLIT_SCRIPTS}
          value={translitScript}
          onChange={(id: QuranTranslitScript) => {
            void setQuranTranslitScript(id);
          }}
          labelFor={(id) => kk.settings.quranTranslitScriptOption(id)}
        />
        <Text style={[styles.hint, { marginBottom: 4 }]}>{kk.settings.quranTranslitScriptHint}</Text>
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
          labelFor={(id) => tr(QURAN_READING_THEMES.find((t) => t.id === id)?.labelKk ?? id)}
        />
        <Text style={[styles.hint, { marginBottom: 10 }]}>{kk.quran.readerReadingThemeHint}</Text>
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
                  {tr(quranReciterGroupLabelKk(group))}
                </Text>
                {items.map((r) => {
                  const available = r.audioAvailable !== false;
                  const label = available
                    ? tr(r.labelKk)
                    : `${tr(r.labelKk)} (${kk.quran.readerReciterSoon})`;
                  return (
                    <SettingsChoiceRow
                      key={r.edition}
                      colors={colors}
                      label={label}
                      selected={prefs.reciterEdition === r.edition}
                      disabled={!available}
                      accessibilityLabel={
                        available ? label : kk.quran.readerReciterUnavailableA11y(tr(r.labelKk))
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
