import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import { useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { navigateToMoreStackScreen, navigateToQuranMushafBook } from "../navigation/navigateToMoreStack";
import { loadQuranLastReadState, type QuranLastReadGlobal } from "../storage/quranLastRead";
import { getBookmarkedSurahs } from "../storage/quranBookmarks";
import { loadAyahMarkers, type AyahMarkerRecord } from "../storage/quranAyahMarkers";
import { hatimProgressFraction, loadHatimProgress, loadHatimResume, type HatimResume } from "../storage/hatimProgress";
import { loadHalalFavorites, type HalalFavoriteCompany } from "../storage/halalLocalPrefs";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { ScreenFitScrollView } from "../components/ScreenFit";

type SavedSnapshot = {
  lastRead: QuranLastReadGlobal | null;
  hatimResume: HatimResume | null;
  hatimReadCount: number;
  bookmarkedSurahs: number[];
  ayahMarkers: Array<{ key: string; surah: number; ayah: number; marker: AyahMarkerRecord }>;
  halalFavorites: HalalFavoriteCompany[];
};

const emptySnapshot = (): SavedSnapshot => ({
  lastRead: null,
  hatimResume: null,
  hatimReadCount: 0,
  bookmarkedSurahs: [],
  ayahMarkers: [],
  halalFavorites: [],
});

function parseMarkerKey(key: string): { surah: number; ayah: number } | null {
  const [s, a] = key.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(s) || !Number.isFinite(a) || s < 1 || s > 114 || a < 1) return null;
  return { surah: s, ayah: a };
}

function surahLine(surah: number, ayah?: number): string {
  return `${surah}. ${surahDisplayTitle(surah, "")}${ayah != null ? ` · ${ayah}-аят` : ""}`;
}

function countLine(label: string, count: number, total?: number): string {
  return `${label}: ${count}${total != null ? `/${total}` : ""}`;
}

export function SavedTabScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { tr } = useKkAutoTranslator();
  const [snapshot, setSnapshot] = useState<SavedSnapshot>(() => emptySnapshot());
  const [loading, setLoading] = useState(true);
  useTabHomeBackHeader(navigation, colors);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lastReadState, readSet, hatimResume, bookmarks, markersMap, halalFavorites] = await Promise.all([
        loadQuranLastReadState(),
        loadHatimProgress(),
        loadHatimResume(),
        getBookmarkedSurahs(),
        loadAyahMarkers(),
        loadHalalFavorites(),
      ]);
      const ayahMarkers = Object.entries(markersMap)
        .map(([key, marker]) => {
          const ref = parseMarkerKey(key);
          return ref ? { key, ...ref, marker } : null;
        })
        .filter((row): row is SavedSnapshot["ayahMarkers"][number] => row != null)
        .sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);

      setSnapshot({
        lastRead: lastReadState.global,
        hatimResume,
        hatimReadCount: hatimProgressFraction(readSet).read,
        bookmarkedSurahs: bookmarks,
        ayahMarkers,
        halalFavorites,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const hasSaved =
    snapshot.lastRead ||
    snapshot.hatimResume ||
    snapshot.hatimReadCount > 0 ||
    snapshot.bookmarkedSurahs.length > 0 ||
    snapshot.ayahMarkers.length > 0 ||
    snapshot.halalFavorites.length > 0;

  const openMushaf = (surah: number, ayah = 1) => {
    navigateToQuranMushafBook({ focusSurah: surah, focusAyah: ayah }, navigation);
  };

  return (
    <ScreenFitScrollView
      testID="screen-main-saved"
      style={styles.root}
      contentContainerStyle={styles.content}
      bottom={28}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialIcons name="bookmark" size={26} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{kk.navigation.tabSaved}</Text>
          <Text style={styles.sub}>{kk.dashboard.savedTabHint}</Text>
        </View>
      </View>

      {loading ? <Text style={styles.muted}>{kk.common.loading}</Text> : null}

      {!loading && !hasSaved ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="auto-stories" size={32} color={colors.accent} />
          <Text style={styles.emptyTitle}>{tr("Әзірге сақталған дерек жоқ")}</Text>
          <Text style={styles.emptyText}>
            {tr(
              "Құраннан bookmark қойсаңыз, хатымды жалғастырсаңыз немесе Halal ұйымын таңдаулыға қоссаңыз, бәрі осы жерде жиналады."
            )}
          </Text>
          <View style={styles.quickRow}>
            <QuickButton label={tr("Хатым")} onPress={() => navigateToMoreStackScreen("Hatim", undefined, navigation)} />
            <QuickButton label={tr("Халал")} onPress={() => navigateToMoreStackScreen("Halal", undefined, navigation)} />
          </View>
        </View>
      ) : null}

      {snapshot.lastRead ? (
        <SavedCard
          icon="history"
          title={tr("Соңғы оқылған аят")}
          body={surahLine(snapshot.lastRead.surah, snapshot.lastRead.ayah)}
          action={tr("Ашу")}
          onPress={() => openMushaf(snapshot.lastRead!.surah, snapshot.lastRead!.ayah)}
        />
      ) : null}

      {snapshot.hatimResume || snapshot.hatimReadCount > 0 ? (
        <SavedCard
          icon="menu-book"
          title={tr("Хатым прогресі")}
          body={
            snapshot.hatimResume
              ? `${surahLine(snapshot.hatimResume.surah, snapshot.hatimResume.ayah)} · ${countLine(
                  tr("Оқылған сүре"),
                  snapshot.hatimReadCount,
                  114
                )}`
              : countLine(tr("Оқылған сүре"), snapshot.hatimReadCount, 114)
          }
          action={snapshot.hatimResume ? tr("Жалғастыру") : tr("Хатымды ашу")}
          onPress={() =>
            snapshot.hatimResume
              ? openMushaf(snapshot.hatimResume.surah, snapshot.hatimResume.ayah)
              : navigateToMoreStackScreen("Hatim", undefined, navigation)
          }
        />
      ) : null}

      {snapshot.ayahMarkers.length > 0 ? (
        <Section title={`${tr("Белгіленген аяттар")} · ${snapshot.ayahMarkers.length}`}>
          {snapshot.ayahMarkers.slice(0, 5).map((row) => (
            <SavedCard
              key={row.key}
              icon="label"
              title={surahLine(row.surah, row.ayah)}
              body={row.marker.note.trim() || tr("Белгі қойылған аят")}
              action={tr("Ашу")}
              onPress={() => openMushaf(row.surah, row.ayah)}
              compact
            />
          ))}
        </Section>
      ) : null}

      {snapshot.bookmarkedSurahs.length > 0 ? (
        <Section title={`${tr("Bookmark сүрелер")} · ${snapshot.bookmarkedSurahs.length}`}>
          <View style={styles.chipWrap}>
            {snapshot.bookmarkedSurahs.slice(0, 18).map((surah) => (
              <Pressable
                key={surah}
                onPress={() => openMushaf(surah, 1)}
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.88 }]}
                accessibilityRole="button"
              >
                <Text style={styles.chipTxt}>{surahLine(surah)}</Text>
              </Pressable>
            ))}
          </View>
        </Section>
      ) : null}

      {snapshot.halalFavorites.length > 0 ? (
        <Section title={`${tr("Halal таңдаулылар")} · ${snapshot.halalFavorites.length}`}>
          {snapshot.halalFavorites.slice(0, 5).map((item) => (
            <SavedCard
              key={item.id}
              icon="verified"
              title={item.title}
              body={tr("Halal ұйымы таңдаулыға қосылған")}
              action={tr("Halal ашу")}
              onPress={() => navigateToMoreStackScreen("Halal", undefined, navigation)}
              compact
            />
          ))}
        </Section>
      ) : null}
    </ScreenFitScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function QuickButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.9 }]}>
      <Text style={styles.quickTxt}>{label}</Text>
    </Pressable>
  );
}

function SavedCard({
  icon,
  title,
  body,
  action,
  onPress,
  compact = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  body: string;
  action: string;
  onPress: () => void;
  compact?: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
    >
      <View style={styles.cardIcon}>
        <MaterialIcons name={icon} size={20} color={colors.accent} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.cardText} numberOfLines={compact ? 2 : 3}>{body}</Text>
      </View>
      <Text style={styles.action}>{action}</Text>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 18, paddingBottom: 32 },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 14,
    },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    title: { color: colors.text, fontSize: 21, fontWeight: "900", marginBottom: 4 },
    sub: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    muted: { color: colors.muted, textAlign: "center", marginTop: 20 },
    emptyCard: {
      alignItems: "center",
      padding: 18,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "900", marginTop: 10 },
    emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 8 },
    quickRow: { flexDirection: "row", gap: 10, marginTop: 14 },
    quickBtn: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
    quickTxt: { color: "#fff", fontSize: 13, fontWeight: "900" },
    section: { marginTop: 16, gap: 8 },
    sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "900" },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 13,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 8,
    },
    cardCompact: { paddingVertical: 10 },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    cardBody: { flex: 1, minWidth: 0 },
    cardTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
    cardText: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
    action: { color: colors.accent, fontSize: 12, fontWeight: "900" },
    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 11,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chipTxt: { color: colors.text, fontSize: 12, fontWeight: "800" },
  });
}
