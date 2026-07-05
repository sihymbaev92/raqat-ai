import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Platform } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { useAppTheme } from "../../theme/ThemeContext";
import { kk } from "../../i18n/kk";
import { HalalFilterChipRow, type HalalFilterChip } from "../HalalFilterChipRow";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";

export type HalalCheckFlowPhase = null | "registry";

type Props = {
  colors: ThemeColors;
  productStatusChips: HalalFilterChip[];
  productStatusFilter: string;
  onProductStatusFilterChange: (v: string) => void;
  checkBusy: boolean;
  checkErr: string | null;
  checkFlowPhase: HalalCheckFlowPhase;
  lastBarcode: string | null;
  onOpenBarcode: () => void;
  onSubmitBarcode: (barcode: string) => void;
};

export function HalalVerifyHub({
  colors,
  productStatusChips,
  productStatusFilter,
  onProductStatusFilterChange,
  checkBusy,
  checkErr,
  checkFlowPhase,
  lastBarcode,
  onOpenBarcode,
  onSubmitBarcode,
}: Props) {
  const { isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const isWeb = Platform.OS === "web";
  const [manualBarcode, setManualBarcode] = useState("");

  const submitManual = () => {
    const digits = manualBarcode.replace(/\D/g, "").trim();
    if (digits.length < 4) return;
    onSubmitBarcode(digits);
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <MaterialIcons name="fact-check" size={22} color={colors.accent} />
        <Text style={styles.headTitle}>{kk.features.halalCheckSectionTitle}</Text>
      </View>

      <Text style={styles.lead}>{kk.features.halalBarcodeOnlyLead}</Text>

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

      {isWeb ? (
        <View style={styles.webBarcodeBlock}>
          <View style={styles.webBarcodeRow}>
            <MaterialIcons name="qr-code-2" size={22} color={colors.muted} />
            <TextInput
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder={kk.features.halalBarcodeWebPlaceholder}
              placeholderTextColor={colors.muted}
              style={styles.webBarcodeInput}
              keyboardType="number-pad"
              inputMode="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              accessibilityLabel={kk.features.halalBarcodeWebPlaceholder}
              onSubmitEditing={submitManual}
              returnKeyType="search"
            />
          </View>
          <Pressable
            onPress={submitManual}
            disabled={checkBusy || manualBarcode.replace(/\D/g, "").length < 4}
            style={({ pressed }) => [
              styles.runBtn,
              pressed && !checkBusy && { opacity: 0.92 },
              (checkBusy || manualBarcode.replace(/\D/g, "").length < 4) && { opacity: 0.65 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={kk.features.halalBarcodeCheckBtn}
          >
            {checkBusy ? (
              <RaqatOrnamentSpinner size={22} />
            ) : (
              <>
                <MaterialIcons name="search" size={20} color="#fff" />
                <Text style={styles.runTxt}>{kk.features.halalBarcodeCheckBtn}</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
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
          <MaterialIcons name="qr-code-scanner" size={32} color={colors.accent} />
          <Text style={styles.actionLbl} numberOfLines={2}>
            {kk.features.halalCheckBarcodeBtn}
          </Text>
          <Text style={styles.actionSub}>{kk.features.halalBarcodeOnlyHint}</Text>
        </Pressable>
      )}

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
    actionTile: {
      minHeight: 112,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 16,
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
    webBarcodeBlock: {
      marginTop: 8,
      gap: 10,
    },
    webBarcodeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === "ios" ? 8 : 4,
    },
    webBarcodeInput: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      minHeight: 40,
      fontVariant: ["tabular-nums"],
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
