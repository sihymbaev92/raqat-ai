import React, { useMemo, useState } from "react";
import { useAppLocale, useLocaleRevision } from "../i18n/runtime";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { InformationalToolBanner } from "../components/InformationalToolBanner";
import { GuideAccordionSection } from "../components/GuideAccordion";
import { openOfficialSiteInApp } from "../config/officialSiteProxy";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import {
  FATUA_ZAKAT_SEARCH_URL,
  MUFTYAT_ZAKAT_SEARCH_URL,
  ZAKAT_GUIDE_SECTIONS,
} from "../content/zakatCalculatorContent";
import {
  computeNisabKzt,
  computeZakatTotals,
  formatKzt,
  GOLD_NISAB_GRAMS,
  SILVER_NISAB_GRAMS,
  type NisabMode,
  type ZakatAmountInput,
} from "../content/zakatCalculatorLogic";

type Props = NativeStackScreenProps<MoreStackParamList, "ZakatCalculator">;

type AmountField = {
  key: keyof ZakatAmountInput;
  label: string;
  hint: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const INITIAL_AMOUNTS: ZakatAmountInput = {
  cash: "",
  gold: "",
  silver: "",
  tradeGoods: "",
  receivables: "",
  debts: "",
  nisab: "",
};

export function ZakatCalculatorScreen({ navigation }: Props) {
  useAppLocale();
  const localeRev = useLocaleRevision();
  const { tr } = useKkAutoTranslator();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [amounts, setAmounts] = useState<ZakatAmountInput>(INITIAL_AMOUNTS);
  const [nisabMode, setNisabMode] = useState<NisabMode>("manual");
  const [pricePerGram, setPricePerGram] = useState("");
  const [openGuide, setOpenGuide] = useState<Record<string, boolean>>({});

  const amountFields: AmountField[] = useMemo(
    () => [
      { key: "cash", label: kk.zakatCalculator.cash, hint: kk.zakatCalculator.cashHint, icon: "account-balance-wallet" },
      { key: "gold", label: kk.zakatCalculator.gold, hint: kk.zakatCalculator.goldHint, icon: "workspace-premium" },
      { key: "silver", label: kk.zakatCalculator.silver, hint: kk.zakatCalculator.silverHint, icon: "toll" },
      { key: "tradeGoods", label: kk.zakatCalculator.tradeGoods, hint: kk.zakatCalculator.tradeGoodsHint, icon: "storefront" },
      { key: "receivables", label: kk.zakatCalculator.receivables, hint: kk.zakatCalculator.receivablesHint, icon: "receipt-long" },
      { key: "debts", label: kk.zakatCalculator.debts, hint: kk.zakatCalculator.debtsHint, icon: "remove-circle-outline" },
    ],
    [localeRev]
  );

  const nisabModes: { id: NisabMode; label: string }[] = useMemo(
    () => [
      { id: "manual", label: kk.zakatCalculator.nisabModeManual },
      { id: "gold", label: kk.zakatCalculator.nisabModeGold },
      { id: "silver", label: kk.zakatCalculator.nisabModeSilver },
    ],
    [localeRev]
  );
  const computedNisab = useMemo(
    () => computeNisabKzt(nisabMode, nisabMode === "gold" ? GOLD_NISAB_GRAMS : SILVER_NISAB_GRAMS, pricePerGram),
    [nisabMode, pricePerGram]
  );

  const totals = useMemo(() => {
    const override = nisabMode === "manual" ? undefined : computedNisab;
    return computeZakatTotals(amounts, override);
  }, [amounts, computedNisab, nisabMode]);

  const setField = (key: keyof ZakatAmountInput, value: string) => {
    setAmounts((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGuide = (title: string) => {
    setOpenGuide((cur) => ({ ...cur, [title]: !cur[title] }));
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <InformationalToolBanner colors={colors} hint={kk.zakatCalculator.boundaryHint} />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialIcons name="calculate" size={30} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{kk.kmdbHub.eyebrow}</Text>
          <Text style={styles.title}>{kk.zakatCalculator.title}</Text>
          <Text style={styles.lead}>{kk.zakatCalculator.lead}</Text>
        </View>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>{kk.zakatCalculator.resultTitle}</Text>
        <Text style={styles.resultAmount}>{formatKzt(totals.zakat)}</Text>
        <Text style={styles.resultHint}>
          {totals.hasNisab
            ? totals.reachedNisab
              ? kk.zakatCalculator.nisabReached
              : kk.zakatCalculator.nisabMissing(formatKzt(totals.missing))
            : kk.zakatCalculator.nisabNotSet}
        </Text>
        <Text style={styles.hawlNote}>{kk.zakatCalculator.hawlNote}</Text>
        <View style={styles.summaryGrid}>
          <SummaryCell label={kk.zakatCalculator.assetsTotal} value={formatKzt(totals.assets)} />
          <SummaryCell label={kk.zakatCalculator.debtsTotal} value={formatKzt(totals.debts)} />
          <SummaryCell label={kk.zakatCalculator.netTotal} value={formatKzt(totals.net)} />
          <SummaryCell label={kk.zakatCalculator.rateLabel} value="2.5%" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>{kk.zakatCalculator.nisabHelperTitle}</Text>
      <View style={styles.nisabModeRow}>
        {nisabModes.map((mode) => {
          const active = nisabMode === mode.id;
          return (
            <Pressable
              key={mode.id}
              onPress={() => setNisabMode(mode.id)}
              style={({ pressed }) => [styles.nisabChip, active && styles.nisabChipActive, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.nisabChipTxt, active && styles.nisabChipTxtActive]}>{mode.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {nisabMode === "manual" ? (
        <View style={styles.fieldCard}>
          <View style={styles.fieldTop}>
            <MaterialIcons name="verified" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{kk.zakatCalculator.nisab}</Text>
              <Text style={styles.fieldHint}>{kk.zakatCalculator.nisabHint}</Text>
            </View>
          </View>
          <TextInput
            value={amounts.nisab}
            onChangeText={(value) => setField("nisab", value)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
      ) : (
        <View style={styles.fieldCard}>
          <View style={styles.fieldTop}>
            <MaterialIcons name="scale" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{kk.zakatCalculator.pricePerGram}</Text>
              <Text style={styles.fieldHint}>{kk.zakatCalculator.pricePerGramHint}</Text>
            </View>
          </View>
          <TextInput
            value={pricePerGram}
            onChangeText={setPricePerGram}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          {computedNisab > 0 ? (
            <Text style={styles.computedNisab}>{kk.zakatCalculator.computedNisab(formatKzt(computedNisab))}</Text>
          ) : null}
        </View>
      )}

      <Text style={styles.sectionTitle}>{kk.zakatCalculator.inputsTitle}</Text>
      {amountFields.map((field) => (
        <View key={field.key} style={styles.fieldCard}>
          <View style={styles.fieldTop}>
            <MaterialIcons name={field.icon} size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldHint}>{field.hint}</Text>
            </View>
          </View>
          <TextInput
            value={amounts[field.key]}
            onChangeText={(value) => setField(field.key, value)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
      ))}

      <Text style={styles.sectionTitle}>{kk.zakatCalculator.guideTitle}</Text>
      {ZAKAT_GUIDE_SECTIONS.map((section) => (
        <GuideAccordionSection
          key={section.title}
          title={tr(section.title)}
          expanded={!!openGuide[section.title]}
          onToggle={() => toggleGuide(section.title)}
          colors={colors}
        >
          <Text style={styles.guideBody}>{tr(section.body)}</Text>
        </GuideAccordionSection>
      ))}

      <View style={styles.noteCard}>
        <MaterialIcons name="info-outline" size={22} color={colors.accent} />
        <Text style={styles.noteText}>{kk.zakatCalculator.disclaimer}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => openOfficialSiteInApp(FATUA_ZAKAT_SEARCH_URL, navigation)}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.zakatCalculator.openFatuaA11y}
        >
          <MaterialIcons name="open-in-new" size={16} color="#fff" />
          <Text style={styles.actionTxt}>{kk.zakatCalculator.openFatua}</Text>
        </Pressable>
        <Pressable
          onPress={() => openOfficialSiteInApp(MUFTYAT_ZAKAT_SEARCH_URL, navigation)}
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.zakatCalculator.openMuftyatA11y}
        >
          <MaterialIcons name="menu-book" size={16} color={colors.accent} />
          <Text style={[styles.actionTxt, styles.actionTxtSecondary]}>{kk.zakatCalculator.openMuftyat}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => {
          setAmounts(INITIAL_AMOUNTS);
          setPricePerGram("");
          setNisabMode("manual");
        }}
        style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryTxt}>{kk.zakatCalculator.clear}</Text>
      </Pressable>
    </ScrollView>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 14, paddingBottom: 36 },
    hero: {
      flexDirection: "row",
      gap: 12,
      padding: 16,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 12,
    },
    heroIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    eyebrow: { color: colors.accentDark, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
    title: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 3 },
    lead: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    resultCard: {
      padding: 16,
      borderRadius: 20,
      backgroundColor: isDark ? "rgba(56, 178, 172, 0.18)" : "rgba(201, 162, 39, 0.16)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accentSurfaceStrong,
      marginBottom: 16,
    },
    resultLabel: { color: colors.muted, fontSize: 12, fontWeight: "800" },
    resultAmount: { color: colors.text, fontSize: 34, fontWeight: "900", marginTop: 4 },
    resultHint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    hawlNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 8, fontStyle: "italic" },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
    summaryCell: {
      width: "48.5%",
      padding: 10,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    summaryLabel: { color: colors.muted, fontSize: 11, lineHeight: 15 },
    summaryValue: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 3 },
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 8, marginTop: 4 },
    nisabModeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
    nisabChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    nisabChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    nisabChipTxt: { color: colors.text, fontSize: 12, fontWeight: "800" },
    nisabChipTxtActive: { color: "#fff" },
    fieldCard: {
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 10,
    },
    fieldTop: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginBottom: 10 },
    fieldLabel: { color: colors.text, fontSize: 14, fontWeight: "900" },
    fieldHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
    input: {
      color: colors.text,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 18,
      fontWeight: "800",
    },
    computedNisab: { color: colors.accent, fontSize: 13, fontWeight: "800", marginTop: 8 },
    guideBody: { color: colors.text, fontSize: 14, lineHeight: 22 },
    noteCard: {
      flexDirection: "row",
      gap: 10,
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginTop: 4,
    },
    noteText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
    actions: { flexDirection: "row", gap: 10, marginTop: 14 },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingVertical: 12,
    },
    actionBtnSecondary: {
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    actionTxt: { color: "#fff", fontSize: 12, fontWeight: "900" },
    actionTxtSecondary: { color: colors.accent },
    secondaryBtn: {
      marginTop: 10,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    secondaryTxt: { color: colors.text, fontSize: 13, fontWeight: "900" },
  });
}
