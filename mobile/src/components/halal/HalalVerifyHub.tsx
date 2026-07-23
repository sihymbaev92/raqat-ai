import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Platform } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { useAppTheme } from "../../theme/ThemeContext";
import { kk } from "../../i18n/kk";
import { HalalFilterChipRow, type HalalFilterChip } from "../HalalFilterChipRow";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { useAppLocale } from "../../i18n/runtime";

export type HalalCheckFlowPhase = null | "registry";

const QUICK_ECODE_CHIPS = ["E120", "E441", "E471", "E904", "желатин", "шеллак"] as const;

type Props = {
  colors: ThemeColors;
  productStatusChips: HalalFilterChip[];
  productStatusFilter: string;
  onProductStatusFilterChange: (v: string) => void;
  checkBusy: boolean;
  checkErr: string | null;
  checkFlowPhase: HalalCheckFlowPhase;
  lastBarcode: string | null;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onPasteIngredients: () => void;
  onOpenBarcode: () => void;
};

function isMostlyBarcodeDigits(q: string): boolean {
  const digits = q.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 14 && digits.length >= q.replace(/\s/g, "").length - 1;
}

export function HalalVerifyHub({
  colors,
  productStatusChips,
  productStatusFilter,
  onProductStatusFilterChange,
  checkBusy,
  checkErr,
  checkFlowPhase,
  lastBarcode,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onPasteIngredients,
  onOpenBarcode,
}: Props) {
  useAppLocale();
  const { isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [localHint, setLocalHint] = useState(false);

  const submitSearch = () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setLocalHint(true);
      return;
    }
    setLocalHint(false);
    onSearchSubmit(q);
  };

  const canSearch = searchQuery.trim().length >= 2;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <MaterialIcons name="fact-check" size={22} color={colors.accent} />
        <Text style={styles.headTitle}>{kk.features.halalCheckSectionTitle}</Text>
      </View>

      <Text style={styles.lead}>{kk.features.halalVerifyLead}</Text>

      <HalalFilterChipRow
        chips={productStatusChips}
        value={productStatusFilter}
        onChange={onProductStatusFilterChange}
        colors={colors}
        accessibilityGroupLabel={kk.features.halalProductStatusLabel}
      />

      {checkFlowPhase ? (
        <View style={styles.flowBanner} accessibilityLiveRegion="polite">
          <RaqatOrnamentSpinner size={20} />
          <Text style={styles.flowTxt}>{kk.features.halalScanFlowRegistry}</Text>
        </View>
      ) : null}

      <View style={styles.searchBlock}>
        <View style={styles.searchRow}>
          <MaterialIcons name="science" size={22} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={(t) => {
              setLocalHint(false);
              onSearchQueryChange(t);
            }}
            placeholder={kk.features.halalGoodsQuickPlaceholder}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            maxLength={2000}
            accessibilityLabel={kk.features.halalGoodsQuickPlaceholder}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => onSearchQueryChange("")}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={kk.common.close}
            >
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={submitSearch}
          disabled={checkBusy || !canSearch}
          style={({ pressed }) => [
            styles.runBtn,
            pressed && !checkBusy && canSearch && { opacity: 0.92 },
            (checkBusy || !canSearch) && { opacity: 0.65 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={kk.features.halalCheckRun}
        >
          {checkBusy ? (
            <RaqatOrnamentSpinner size={22} />
          ) : (
            <>
              <MaterialIcons name="search" size={20} color="#fff" />
              <Text style={styles.runTxt}>
                {isMostlyBarcodeDigits(searchQuery)
                  ? kk.features.halalBarcodeCheckBtn
                  : kk.features.halalCheckRun}
              </Text>
            </>
          )}
        </Pressable>
        {localHint ? <Text style={styles.hintTxt}>{kk.features.halalCheckMin2}</Text> : null}
        <Text style={styles.hintTxt}>{kk.features.halalCheckTryEcodeHint}</Text>
        <Text style={styles.hintTxt}>{kk.features.halalVerifyPasteIngredientsHint}</Text>
        <Pressable
          onPress={onPasteIngredients}
          disabled={checkBusy}
          style={({ pressed }) => [
            styles.pasteBtn,
            pressed && !checkBusy && { opacity: 0.9 },
            checkBusy && { opacity: 0.55 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={kk.features.halalCheckPasteIngredientsCta}
        >
          <MaterialIcons name="content-paste" size={18} color={colors.accent} />
          <Text style={styles.pasteBtnTxt}>{kk.features.halalCheckPasteIngredientsCta}</Text>
        </Pressable>
        <Text style={styles.quickLabel}>{kk.features.halalVerifyQuickCodesHint}</Text>
        <View style={styles.quickRow}>
          {QUICK_ECODE_CHIPS.map((chip) => (
            <Pressable
              key={chip}
              disabled={checkBusy}
              onPress={() => {
                onSearchQueryChange(chip);
                onSearchSubmit(chip);
              }}
              style={({ pressed }) => [
                styles.quickChip,
                pressed && !checkBusy && { opacity: 0.88 },
                checkBusy && { opacity: 0.55 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={chip}
            >
              <Text style={styles.quickChipTxt}>{chip}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        onPress={onOpenBarcode}
        disabled={checkBusy}
        style={({ pressed }) => [
          styles.actionTile,
          pressed && !checkBusy && { opacity: 0.92 },
          checkBusy && { opacity: 0.65 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={kk.features.halalCheckBarcodeBtn}
      >
        <MaterialIcons name="qr-code-scanner" size={28} color={colors.accent} />
        <Text style={styles.actionLbl} numberOfLines={2}>
          {kk.features.halalCheckBarcodeBtn}
        </Text>
        <Text style={styles.actionSub}>{kk.features.halalBarcodeOnlyHint}</Text>
      </Pressable>

      {lastBarcode ? (
        <Text style={styles.lastBarcode} accessibilityLabel={kk.features.halalLastBarcodeLabel(lastBarcode)}>
          {kk.features.halalLastBarcodeLabel(lastBarcode)}
        </Text>
      ) : null}

      {checkErr ? (
        <View style={styles.errBox} accessibilityRole="alert">
          <MaterialIcons name="error-outline" size={18} color={colors.error} />
          <Text style={styles.err}>{checkErr}</Text>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    card: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 14,
      marginBottom: 12,
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    headTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "900",
      color: colors.text,
    },
    lead: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
      marginBottom: 10,
    },
    flowBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.accentSurface,
      marginBottom: 10,
    },
    flowTxt: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    searchBlock: {
      marginTop: 4,
      gap: 8,
      marginBottom: 4,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === "ios" ? 10 : 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      minHeight: 40,
      maxHeight: 120,
      textAlignVertical: "top",
    },
    hintTxt: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.muted,
      fontWeight: "600",
    },
    pasteBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    pasteBtnTxt: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.accent,
    },
    quickLabel: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "800",
      color: colors.text,
    },
    quickRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    quickChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    quickChipTxt: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.accent,
    },
    actionTile: {
      minHeight: 96,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      marginTop: 8,
    },
    actionLbl: {
      fontSize: 15,
      fontWeight: "900",
      color: colors.text,
      textAlign: "center",
    },
    actionSub: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
      color: colors.muted,
      textAlign: "center",
      paddingHorizontal: 8,
    },
    runBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.accent,
    },
    runTxt: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "900",
    },
    lastBarcode: {
      marginTop: 10,
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      fontVariant: ["tabular-nums"],
    },
    errBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 10,
      padding: 10,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.error}44`,
      backgroundColor: isDark ? "rgba(220,38,38,0.1)" : "rgba(220,38,38,0.06)",
    },
    err: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: colors.error,
      textAlign: "left",
    },
  });
}
