import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../../navigation/types";
import type { TraditionKazakhPalette } from "../../theme/traditionKazakhTheme";
import {
  getTraditionReligiousEvidence,
  type TraditionEvidenceBlock,
  type TraditionEvidenceRef,
} from "../../content/traditionReligiousEvidence";
import { useI18n } from "../../i18n/useI18n";

type Nav = NativeStackNavigationProp<MoreStackParamList>;

type Props = {
  topicId: string;
  palette: TraditionKazakhPalette;
  nav: Nav;
  tr: (text: string) => string;
};

function EvidenceRefRow({
  ref: evidenceRef,
  palette,
  nav,
  tr,
}: {
  ref: TraditionEvidenceRef;
  palette: TraditionKazakhPalette;
  nav: Nav;
  tr: (text: string) => string;
}) {
  const styles = useMemo(() => makeRefStyles(palette), [palette]);
  const tg = useI18n().features.traditionGuide;
  const isQuran = evidenceRef.kind === "quran";
  const canOpenHadith = evidenceRef.kind === "hadith" && Boolean(evidenceRef.hadithId);

  const onPress = () => {
    if (isQuran) {
      nav.navigate("QuranSurah", {
        surahNumber: evidenceRef.surah,
        initialAyah: evidenceRef.ayah,
      });
      return;
    }
    if (canOpenHadith && evidenceRef.kind === "hadith") {
      nav.navigate("HadithDetail", { hadithId: evidenceRef.hadithId! });
    }
  };

  const tappable = isQuran || canOpenHadith;

  return (
    <Pressable
      oyuBackdrop={false}
      onPress={tappable ? onPress : undefined}
      disabled={!tappable}
      style={({ pressed }) => [styles.refRow, tappable && pressed && { opacity: 0.9 }]}
      accessibilityRole={tappable ? "button" : "text"}
      accessibilityLabel={`${tr(evidenceRef.citationKk)}. ${tr(evidenceRef.excerptKk)}`}
    >
      <View style={[styles.refIcon, isQuran ? styles.refIconQuran : styles.refIconHadith]}>
        <MaterialIcons
          name={isQuran ? "menu-book" : "auto-stories"}
          size={18}
          color={isQuran ? palette.bannerBg : palette.gold}
        />
      </View>
      <View style={styles.refBody}>
        <Text style={styles.refCitation}>{tr(evidenceRef.citationKk)}</Text>
        <Text style={styles.refLabel}>{tr(tg.traditionEvidenceMeaningLabel)}</Text>
        <Text style={styles.refExcerpt}>{tr(evidenceRef.excerptKk)}</Text>
        {tappable ? (
          <Text style={styles.refOpen}>
            {isQuran ? tr(tg.traditionEvidenceOpenQuran) : tr(tg.traditionEvidenceOpenHadith)}
          </Text>
        ) : null}
      </View>
      {tappable ? <MaterialIcons name="chevron-right" size={20} color={palette.goldMuted} /> : null}
    </Pressable>
  );
}

function EvidenceBlockCard({
  block,
  palette,
  nav,
  tr,
}: {
  block: TraditionEvidenceBlock;
  palette: TraditionKazakhPalette;
  nav: Nav;
  tr: (text: string) => string;
}) {
  const styles = useMemo(() => makeBlockStyles(palette), [palette]);
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{tr(block.titleKk)}</Text>
      {block.noteKk ? <Text style={styles.blockNote}>{tr(block.noteKk)}</Text> : null}
      {block.refs.map((r, i) => (
        <EvidenceRefRow key={`${block.id}-${i}`} ref={r} palette={palette} nav={nav} tr={tr} />
      ))}
    </View>
  );
}

export function TraditionReligiousEvidenceSection({ topicId, palette, nav, tr }: Props) {
  const tg = useI18n().features.traditionGuide;
  const blocks = getTraditionReligiousEvidence(topicId);
  const styles = useMemo(() => makeStyles(palette), [palette]);

  if (!blocks.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <MaterialIcons name="verified" size={20} color={palette.bannerBg} />
        <Text style={styles.headTitle}>{tr(tg.traditionEvidenceTitle)}</Text>
      </View>
      <Text style={styles.hint}>{tr(tg.traditionEvidenceHint)}</Text>
      {blocks.map((block) => (
        <EvidenceBlockCard key={block.id} block={block} palette={palette} nav={nav} tr={tr} />
      ))}
      <Text style={styles.disclaimer}>{tr(tg.traditionEvidenceDisclaimer)}</Text>
    </View>
  );
}

function makeStyles(palette: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: { marginTop: 14, gap: 10 },
    head: { flexDirection: "row", alignItems: "center", gap: 8 },
    headTitle: { fontSize: 15, fontWeight: "800", color: palette.text },
    hint: { fontSize: 12, lineHeight: 17, color: palette.muted },
    disclaimer: {
      fontSize: 11,
      lineHeight: 16,
      color: palette.muted,
      fontStyle: "italic",
      marginTop: 4,
    },
  });
}

function makeBlockStyles(palette: TraditionKazakhPalette) {
  return StyleSheet.create({
    block: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
      backgroundColor: palette.cardBg,
      padding: 12,
      gap: 8,
    },
    blockTitle: { fontSize: 14, fontWeight: "800", color: palette.text },
    blockNote: { fontSize: 12, lineHeight: 17, color: palette.muted },
  });
}

function makeRefStyles(palette: TraditionKazakhPalette) {
  return StyleSheet.create({
    refRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: palette.border,
    },
    refIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    refIconQuran: { backgroundColor: "rgba(16, 124, 65, 0.12)" },
    refIconHadith: { backgroundColor: "rgba(184, 134, 11, 0.14)" },
    refBody: { flex: 1, minWidth: 0 },
    refCitation: { fontSize: 13, fontWeight: "800", color: palette.text },
    refLabel: { fontSize: 10, fontWeight: "900", color: palette.gold, marginTop: 3, textTransform: "uppercase" },
    refExcerpt: { fontSize: 12, lineHeight: 17, color: palette.muted, marginTop: 3 },
    refOpen: { fontSize: 11, fontWeight: "700", color: palette.bannerBg, marginTop: 4 },
  });
}
