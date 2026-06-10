import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import type { MoreStackParamList } from "../navigation/types";
import { navigateToMoreStackScreen } from "../navigation/navigateToMoreStack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";

type Props = NativeStackScreenProps<MoreStackParamList, "ZakatCalculator">;

type AmountField = {
  key: keyof AmountState;
  label: string;
  hint: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

type AmountState = {
  cash: string;
  gold: string;
  silver: string;
  tradeGoods: string;
  receivables: string;
  debts: string;
  nisab: string;
};

const INITIAL_AMOUNTS: AmountState = {
  cash: "",
  gold: "",
  silver: "",
  tradeGoods: "",
  receivables: "",
  debts: "",
  nisab: "",
};

const ZAKAT_RATE = 0.025;

function parseAmount(raw: string): number {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatKzt(value: number): string {
  const rounded = Math.round(Math.max(0, value));
  try {
    return new Intl.NumberFormat("kk-KZ").format(rounded) + " ₸";
  } catch {
    return `${rounded.toLocaleString()} ₸`;
  }
}

const amountFields: AmountField[] = [
  {
    key: "cash",
    label: kk.zakatCalculator.cash,
    hint: kk.zakatCalculator.cashHint,
    icon: "account-balance-wallet",
  },
  {
    key: "gold",
    label: kk.zakatCalculator.gold,
    hint: kk.zakatCalculator.goldHint,
    icon: "workspace-premium",
  },
  {
    key: "silver",
    label: kk.zakatCalculator.silver,
    hint: kk.zakatCalculator.silverHint,
    icon: "toll",
  },
  {
    key: "tradeGoods",
    label: kk.zakatCalculator.tradeGoods,
    hint: kk.zakatCalculator.tradeGoodsHint,
    icon: "storefront",
  },
  {
    key: "receivables",
    label: kk.zakatCalculator.receivables,
    hint: kk.zakatCalculator.receivablesHint,
    icon: "receipt-long",
  },
  {
    key: "debts",
    label: kk.zakatCalculator.debts,
    hint: kk.zakatCalculator.debtsHint,
    icon: "remove-circle-outline",
  },
  {
    key: "nisab",
    label: kk.zakatCalculator.nisab,
    hint: kk.zakatCalculator.nisabHint,
    icon: "verified",
  },
];

export function ZakatCalculatorScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [amounts, setAmounts] = useState<AmountState>(INITIAL_AMOUNTS);

  const totals = useMemo(() => {
    const assets =
      parseAmount(amounts.cash) +
      parseAmount(amounts.gold) +
      parseAmount(amounts.silver) +
      parseAmount(amounts.tradeGoods) +
      parseAmount(amounts.receivables);
    const debts = parseAmount(amounts.debts);
    const net = Math.max(0, assets - debts);
    const nisab = parseAmount(amounts.nisab);
    const hasNisab = nisab > 0;
    const reachedNisab = hasNisab ? net >= nisab : net > 0;
    const zakat = reachedNisab ? net * ZAKAT_RATE : 0;
    return {
      assets,
      debts,
      net,
      nisab,
      hasNisab,
      reachedNisab,
      zakat,
      missing: hasNisab ? Math.max(0, nisab - net) : 0,
    };
  }, [amounts]);

  const setField = (key: keyof AmountState, value: string) => {
    setAmounts((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        <View style={styles.summaryGrid}>
          <SummaryCell label={kk.zakatCalculator.assetsTotal} value={formatKzt(totals.assets)} />
          <SummaryCell label={kk.zakatCalculator.debtsTotal} value={formatKzt(totals.debts)} />
          <SummaryCell label={kk.zakatCalculator.netTotal} value={formatKzt(totals.net)} />
          <SummaryCell label={kk.zakatCalculator.rateLabel} value="2.5%" />
        </View>
      </View>

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

      <View style={styles.noteCard}>
        <MaterialIcons name="info-outline" size={22} color={colors.accent} />
        <Text style={styles.noteText}>{kk.zakatCalculator.disclaimer}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() =>
            navigateToMoreStackScreen(
              "ImamAI",
              { initialPrompt: kk.zakatCalculator.aiPrompt, autoSend: false },
              navigation
            )
          }
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <MaterialIcons name="question-answer" size={18} color="#fff" />
          <Text style={styles.actionTxt}>{kk.zakatCalculator.askAi}</Text>
        </Pressable>
        <Pressable
          onPress={() => setAmounts(INITIAL_AMOUNTS)}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryTxt}>{kk.zakatCalculator.clear}</Text>
        </Pressable>
      </View>
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
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 8 },
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
    actionTxt: { color: "#fff", fontSize: 13, fontWeight: "900" },
    secondaryBtn: {
      paddingHorizontal: 16,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    secondaryTxt: { color: colors.text, fontSize: 13, fontWeight: "900" },
  });
}
