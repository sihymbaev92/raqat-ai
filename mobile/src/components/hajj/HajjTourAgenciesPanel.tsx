import React, { useMemo, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { useAppLocale } from "../../i18n/runtime";
import {
  getHajjTourAgencies,
  type HajjTourAgency,
  type HajjTourService,
} from "../../content/hajjTourAgenciesCatalog";

type Props = {
  colors: ThemeColors;
  tr: (text: string) => string;
};

function serviceLabel(s: HajjTourService): string {
  return s === "hajj" ? kk.features.hajjTourServiceHajj : kk.features.hajjTourServiceUmrah;
}

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => {});
}

function openAgencyPrimary(agency: HajjTourAgency) {
  const site = (agency.website ?? "").trim();
  if (site) {
    openUrl(site.startsWith("http") ? site : `https://${site}`);
    return;
  }
  const wa = (agency.whatsapp ?? "").trim();
  if (wa) {
    if (wa.includes("wa.me") || wa.startsWith("http")) {
      openUrl(wa);
      return;
    }
    const digits = wa.replace(/[^\d+]/g, "");
    openUrl(`https://wa.me/${digits.replace(/^\+/, "")}`);
    return;
  }
  const phone = (agency.phone ?? "").trim();
  if (phone) {
    openUrl(`tel:${phone.replace(/\s/g, "")}`);
  }
}

function AgencyRow({
  agency,
  colors,
  tr,
}: {
  agency: HajjTourAgency;
  colors: ThemeColors;
  tr: (text: string) => string;
}) {
  const styles = useMemo(() => makeRowStyles(colors), [colors]);
  const hasContact = Boolean(
    (agency.website ?? "").trim() || (agency.phone ?? "").trim() || (agency.whatsapp ?? "").trim()
  );

  return (
    <Pressable
      oyuBackdrop={false}
      disabled={!hasContact}
      onPress={() => openAgencyPrimary(agency)}
      style={({ pressed }) => [styles.row, pressed && hasContact && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={kk.features.hajjTourAgencyOpenA11y(tr(agency.name))}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name="travel-explore" size={20} color={colors.accent} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1}>
          {tr(agency.name)}
        </Text>
        <Text style={styles.tagline} numberOfLines={2}>
          {tr(agency.tagline)}
        </Text>
        {agency.city ? (
          <Text style={styles.city} numberOfLines={1}>
            {tr(agency.city)}
          </Text>
        ) : null}
        {agency.services?.length ? (
          <View style={styles.chips}>
            {agency.services.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipTxt}>{serviceLabel(s)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {hasContact ? (
        <MaterialIcons name="chevron-right" size={22} color={colors.accent} />
      ) : null}
    </Pressable>
  );
}

export function HajjTourAgenciesPanel({ colors, tr }: Props) {
  useAppLocale();
  const styles = useMemo(() => makePanelStyles(colors), [colors]);
  const agencies = useMemo(() => getHajjTourAgencies(), []);
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        oyuBackdrop={false}
        onPress={() => setExpanded((cur) => !cur)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${tr(kk.features.hajjTourAgenciesTitle)} — ${expanded ? "жабу" : "ашу"}`}
        style={({ pressed }) => [styles.head, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.headIcon}>
          <MaterialIcons name="mosque" size={20} color={colors.accent} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{tr(kk.features.hajjTourAgenciesTitle)}</Text>
          <Text style={styles.lead} numberOfLines={1}>
            {agencies.length
              ? `${tr(kk.features.hajjTourAgenciesLead)} · ${agencies.length}`
              : tr(kk.features.hajjTourAgenciesLead)}
          </Text>
        </View>
        <MaterialIcons
          name={expanded ? "expand-less" : "expand-more"}
          size={22}
          color={colors.accent}
        />
      </Pressable>

      {expanded && agencies.length ? (
        <View style={styles.list}>
          {agencies.map((agency) => (
            <AgencyRow key={agency.id} agency={agency} colors={colors} tr={tr} />
          ))}
        </View>
      ) : expanded ? (
        <View style={styles.empty}>
          <MaterialIcons name="verified-user" size={20} color={colors.accent} />
          <View style={styles.emptyTextCol}>
            <Text style={styles.emptyTitle}>{tr(kk.features.hajjTourAgenciesEmptyTitle)}</Text>
            <Text style={styles.emptyTxt}>{tr(kk.features.hajjTourAgenciesEmpty)}</Text>
            <View style={styles.checklist}>
              {kk.features.hajjTourAgenciesChecklist.map((item) => (
                <View key={item} style={styles.checkRow}>
                  <MaterialIcons name="check-circle" size={15} color={colors.accent} />
                  <Text style={styles.checkTxt}>{tr(item)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {expanded ? <Text style={styles.disclaimer}>{tr(kk.features.hajjTourAgenciesDisclaimer)}</Text> : null}
    </View>
  );
}

function makePanelStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.accentSurface,
    },
    headIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    headText: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontSize: 14, fontWeight: "900" },
    lead: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 3 },
    list: { paddingVertical: 4 },
    empty: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    emptyTextCol: { flex: 1, minWidth: 0 },
    emptyTitle: { color: colors.text, fontSize: 13, fontWeight: "900", marginBottom: 4 },
    emptyTxt: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 },
    checklist: { gap: 6, marginTop: 10 },
    checkRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
    checkTxt: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: "700" },
    disclaimer: {
      paddingHorizontal: 12,
      paddingBottom: 10,
      paddingTop: 4,
      fontSize: 10,
      lineHeight: 14,
      color: colors.muted,
    },
  });
}

function makeRowStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    textCol: { flex: 1, minWidth: 0, gap: 2 },
    name: { color: colors.text, fontSize: 14, fontWeight: "800" },
    tagline: { color: colors.muted, fontSize: 11, lineHeight: 15 },
    city: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 2 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
    chip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: colors.accentSurface,
    },
    chipTxt: { fontSize: 10, fontWeight: "800", color: colors.accent },
  });
}
