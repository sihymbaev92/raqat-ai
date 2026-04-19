import React, { useMemo, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { ECOSYSTEM_VERSION, ECOSYSTEM_STAGE, getInstitutionCatalog } from "../ecosystem";
import type { InstitutionSource } from "../ecosystem/types";
import { persistCatalogLineage } from "../storage/provenanceRegistry";

function institutionTypeLabel(t: InstitutionSource["type"]): string {
  switch (t) {
    case "university":
      return kk.ecosystem.instTypeUniversity;
    case "research":
      return kk.ecosystem.instTypeResearch;
    case "media":
      return kk.ecosystem.instTypeMedia;
    case "open_data":
      return kk.ecosystem.instTypeOpenData;
    default:
      return kk.ecosystem.instTypeOther;
  }
}

export function EcosystemScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const catalog = useMemo(() => getInstitutionCatalog(), []);

  useEffect(() => {
    void persistCatalogLineage(catalog);
  }, [catalog]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{kk.ecosystem.title}</Text>
      <Text style={styles.mission}>{kk.ecosystem.mission}</Text>

      <Text style={[styles.label, styles.labelSpaced]}>{kk.ecosystem.howTitle}</Text>
      <Text style={styles.howIntro}>{kk.ecosystem.howIntro}</Text>
      {kk.ecosystem.howSteps.map((line, i) => (
        <Text key={i} style={styles.howStep}>
          {i + 1}. {line}
        </Text>
      ))}

      <Text style={[styles.label, styles.labelSpaced]}>{kk.ecosystem.catalogTitle}</Text>
      <Text style={styles.catalogHint}>{kk.ecosystem.catalogHint}</Text>
      <Text style={styles.localStore}>{kk.ecosystem.localStoreNote}</Text>
      {catalog.map((item) => (
        <View key={item.id} style={styles.catalogCard}>
          <View style={styles.catalogTop}>
            <Text style={styles.catalogName}>{item.name}</Text>
            <Text style={styles.typeBadge}>{institutionTypeLabel(item.type)}</Text>
          </View>
          {item.country ? <Text style={styles.catalogMeta}>{item.country}</Text> : null}
          {item.descriptionKk ? <Text style={styles.catalogDesc}>{item.descriptionKk}</Text> : null}
          {item.websiteUrl ? (
            <Pressable onPress={() => Linking.openURL(item.websiteUrl!)}>
              <Text style={styles.link}>{item.websiteUrl}</Text>
            </Pressable>
          ) : null}

          <View style={styles.provBox}>
            <Text style={styles.provTitle}>{kk.ecosystem.provenanceTitle}</Text>
            <Text style={styles.provText}>
              {kk.ecosystem.originLabel} {item.provenance.origin}
            </Text>
            <Text style={styles.provText}>
              {kk.ecosystem.recordedAtLabel}{" "}
              {item.provenance.recordedAt.includes("T")
                ? item.provenance.recordedAt.split("T")[0]
                : item.provenance.recordedAt}
            </Text>
            {item.provenance.licenseHint ? (
              <Text style={styles.provText}>
                {kk.ecosystem.licenseLabel} {item.provenance.licenseHint}
              </Text>
            ) : null}
            <Text style={styles.provEvidence}>
              {kk.ecosystem.evidenceLabel} {item.provenance.evidenceKk}
            </Text>
            {item.provenance.evidenceUrl ? (
              <Pressable onPress={() => Linking.openURL(item.provenance.evidenceUrl!)}>
                <Text style={styles.link}>{item.provenance.evidenceUrl}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}

      <Text style={[styles.label, styles.labelSpaced]}>{kk.ecosystem.pillarsTitle}</Text>
      <View style={styles.pillar}>
        <Text style={styles.pillarTitle}>{kk.ecosystem.pillar1Title}</Text>
        <Text style={styles.pillarBody}>{kk.ecosystem.pillar1Body}</Text>
      </View>
      <View style={styles.pillar}>
        <Text style={styles.pillarTitle}>{kk.ecosystem.pillar2Title}</Text>
        <Text style={styles.pillarBody}>{kk.ecosystem.pillar2Body}</Text>
      </View>
      <View style={styles.pillar}>
        <Text style={styles.pillarTitle}>{kk.ecosystem.pillar3Title}</Text>
        <Text style={styles.pillarBody}>{kk.ecosystem.pillar3Body}</Text>
      </View>

      <Text style={styles.roadmap}>{kk.ecosystem.roadmap}</Text>
      <Text style={styles.footer}>
        {kk.ecosystem.versionLine(ECOSYSTEM_VERSION, ECOSYSTEM_STAGE)}
      </Text>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 40 },
    h1: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 12 },
    mission: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 20,
    },
    label: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    pillar: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillarTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 6 },
    pillarBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    roadmap: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 12,
      marginBottom: 16,
    },
    footer: { color: colors.muted, fontSize: 12, textAlign: "center" },
    catalogHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 6,
    },
    localStore: {
      color: colors.success,
      fontSize: 12,
      marginBottom: 12,
      fontWeight: "600",
    },
    catalogCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    catalogTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },
    catalogName: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 },
    typeBadge: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    catalogMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
    catalogDesc: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8 },
    link: { color: colors.accent, fontSize: 13, marginTop: 8, textDecorationLine: "underline" },
    labelSpaced: { marginTop: 16 },
    howIntro: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 10,
    },
    howStep: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 8,
      paddingLeft: 4,
    },
    provBox: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    provTitle: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 8,
    },
    provText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
    provEvidence: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 4 },
  });
}
