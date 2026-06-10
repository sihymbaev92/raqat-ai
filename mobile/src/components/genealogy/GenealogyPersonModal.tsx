import React, { useMemo } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../../i18n/kk";
import {
  genealogyBreadcrumbLabel,
  genealogyEraLabel,
  genealogyLifeYears,
  genealogySourceLabel,
  type GenealogyPersonHit,
} from "../../services/genealogyLabels";
import type { GenealogyPerson } from "../../services/genealogyApi";
import { getTraditionKazakhPalette } from "../../theme/traditionKazakhTheme";
import { useAppTheme } from "../../theme/ThemeContext";

type Person = GenealogyPersonHit | GenealogyPerson;

type Props = {
  visible: boolean;
  person: Person | null;
  clanPath: string;
  onClose: () => void;
  onOpenClan?: (clanSlug: string) => void;
};

export function GenealogyPersonModal({ visible, person, clanPath, onClose, onOpenClan }: Props) {
  const { colors, isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(palette, colors), [palette, colors]);

  if (!person) return null;

  const years = genealogyLifeYears(person);
  const meta = [person.role_kk, years, genealogyEraLabel(person.era)].filter(Boolean).join(" · ");
  const sources = "sources" in person && person.sources?.length ? person.sources : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={kk.common.close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.name}>{person.name_kk}</Text>
            {person.name_lat ? <Text style={styles.lat}>{person.name_lat}</Text> : null}
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            <Text style={styles.pathLabel}>{kk.features.genealogyPersonClanPath}</Text>
            <Text style={styles.path}>{clanPath}</Text>
            {"bio_kk" in person && person.bio_kk ? (
              <Text style={styles.bio}>{person.bio_kk}</Text>
            ) : null}
            {sources.length > 0 ? (
              <View style={styles.sourcesBox}>
                <Text style={styles.sourcesTitle}>{kk.features.genealogySourcesTitle}</Text>
                {sources.map((s) => (
                  <Text key={s.source_key} style={styles.sourceLine}>
                    • {genealogySourceLabel(s.source_key)}
                    {s.page_or_section ? ` (${s.page_or_section})` : ""}
                    {s.citation_note ? ` — ${s.citation_note}` : ""}
                  </Text>
                ))}
              </View>
            ) : (
              <View style={styles.sourcesBox}>
                <Text style={styles.sourcesTitle}>{kk.features.genealogyTrustEditorialTitle}</Text>
                <Text style={styles.sourceTrustNote}>{kk.features.genealogyTrustEditorialBody}</Text>
              </View>
            )}
          </ScrollView>
          {onOpenClan ? (
            <Pressable
              oyuBackdrop={false}
              style={styles.cta}
              onPress={() => {
                onClose();
                onOpenClan(person.clan_slug);
              }}
            >
              <MaterialIcons name="account-tree" size={18} color={palette.gold} />
              <Text style={styles.ctaText}>{kk.features.genealogyOpenPersonClan}</Text>
            </Pressable>
          ) : null}
          <Pressable oyuBackdrop={false} style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeTxt}>{kk.common.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function genealogyClanPathLabel(
  clanSlug: string,
  nodes: { slug: string; name_kk: string; breadcrumbs?: string[] }[],
): string {
  const node = nodes.find((n) => n.slug === clanSlug);
  if (!node?.breadcrumbs?.length) return genealogyBreadcrumbLabel(clanSlug, nodes);
  return node.breadcrumbs.map((s) => genealogyBreadcrumbLabel(s, nodes)).join(" › ");
}

function makeStyles(
  palette: ReturnType<typeof getTraditionKazakhPalette>,
  colors: ReturnType<typeof useAppTheme>["colors"],
) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    sheet: {
      maxHeight: "82%",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      backgroundColor: colors.bg,
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 24,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.border,
      marginBottom: 12,
    },
    name: { color: colors.text, fontSize: 20, fontWeight: "900", lineHeight: 26 },
    lat: { color: palette.muted, fontSize: 13, marginTop: 4, fontStyle: "italic" },
    meta: { color: palette.gold, fontSize: 13, fontWeight: "700", marginTop: 8 },
    pathLabel: {
      color: palette.muted,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      marginTop: 14,
      marginBottom: 4,
    },
    path: { color: colors.text, fontSize: 14, lineHeight: 20 },
    bio: { color: colors.text, fontSize: 15, lineHeight: 22, marginTop: 12 },
    sourcesBox: { marginTop: 14 },
    sourcesTitle: { color: palette.muted, fontSize: 11, fontWeight: "800", marginBottom: 6 },
    sourceLine: { color: colors.text, fontSize: 13, lineHeight: 18, marginBottom: 2 },
    sourceTrustNote: { color: palette.muted, fontSize: 12, lineHeight: 17 },
    cta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.gold,
      backgroundColor: palette.goldSurface,
    },
    ctaText: { color: palette.gold, fontSize: 14, fontWeight: "800" },
    closeBtn: {
      marginTop: 10,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
    },
    closeTxt: { color: colors.text, fontSize: 15, fontWeight: "700" },
  });
}
