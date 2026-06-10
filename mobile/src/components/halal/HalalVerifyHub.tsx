import React, { useMemo } from "react";
import { View, Text, StyleSheet, TextInput, Platform } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { useAppTheme } from "../../theme/ThemeContext";
import { kk } from "../../i18n/kk";
import { HalalFilterChipRow, type HalalFilterChip } from "../HalalFilterChipRow";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
export type HalalCheckFlowPhase = null | "ai" | "registry";

type Props = {
  colors: ThemeColors;
  productStatusChips: HalalFilterChip[];
  productStatusFilter: string;
  onProductStatusFilterChange: (v: string) => void;
  goodsQuick: string;
  onGoodsQuickChange: (t: string) => void;
  goodsQuickBusy: boolean;
  checkInput: string;
  onCheckInputChange: (t: string) => void;
  checkBusy: boolean;
  checkErr: string | null;
  checkFlowPhase: HalalCheckFlowPhase;
  photoAnalysisText: string | null;
  onOpenCamera: () => void;
  onOpenBarcode: () => void;
  onRunCheck: () => void;
};

export function HalalVerifyHub({
  colors,
  productStatusChips,
  productStatusFilter,
  onProductStatusFilterChange,
  goodsQuick,
  onGoodsQuickChange,
  goodsQuickBusy,
  checkInput,
  onCheckInputChange,
  checkBusy,
  checkErr,
  checkFlowPhase,
  photoAnalysisText,
  onOpenCamera,
  onOpenBarcode,
  onRunCheck,
}: Props) {
  const { isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <MaterialIcons name="fact-check" size={22} color={colors.accent} />
        <Text style={styles.headTitle}>{kk.features.halalCheckSectionTitle}</Text>
      </View>

      <Text style={styles.label}>{kk.features.halalGoodsQuickTitle}</Text>
      <HalalFilterChipRow
        chips={productStatusChips}
        value={productStatusFilter}
        onChange={onProductStatusFilterChange}
        colors={colors}
        accessibilityGroupLabel={kk.features.halalProductStatusLabel}
      />

      <View style={styles.quickRow}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          value={goodsQuick}
          onChangeText={onGoodsQuickChange}
          placeholder={kk.features.halalGoodsQuickPlaceholder}
          placeholderTextColor={colors.muted}
          style={styles.quickInput}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={kk.features.halalGoodsQuickPlaceholder}
        />
        {goodsQuickBusy ? <RaqatOrnamentSpinner size={20} /> : null}
      </View>
      <Text style={styles.hint}>{kk.features.halalGoodsQuickHint}</Text>

      {checkFlowPhase ? (
        <View style={styles.flowBanner} accessibilityLiveRegion="polite">
          <RaqatOrnamentSpinner size={20} />
          <Text style={styles.flowTxt}>
            {checkFlowPhase === "ai" ? kk.features.halalScanFlowAi : kk.features.halalScanFlowRegistry}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          onPress={onOpenCamera}
          style={({ pressed }) => [styles.actionTile, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.features.halalCheckPhotoBtn}
        >
          <MaterialIcons name="photo-camera" size={26} color={colors.accent} />
          <Text style={styles.actionLbl} numberOfLines={2}>
            {kk.features.halalCheckPhotoShort}
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenBarcode}
          style={({ pressed }) => [styles.actionTile, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.features.halalCheckBarcodeBtn}
        >
          <MaterialIcons name="qr-code-scanner" size={26} color={colors.accent} />
          <Text style={styles.actionLbl} numberOfLines={2}>
            {kk.features.halalCheckBarcodeShort}
          </Text>
        </Pressable>
      </View>

      <TextInput
        value={checkInput}
        onChangeText={onCheckInputChange}
        placeholder={kk.features.halalCheckTextPlaceholder}
        placeholderTextColor={colors.muted}
        multiline
        style={styles.multiline}
        accessibilityLabel={kk.features.halalCheckTextPlaceholder}
      />

      <Pressable
        onPress={onRunCheck}
        disabled={checkBusy}
        style={({ pressed }) => [
          styles.runBtn,
          pressed && !checkBusy && { opacity: 0.92 },
          checkBusy && { opacity: 0.65 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={kk.features.halalCheckRun}
      >
        {checkBusy ? (
          <RaqatOrnamentSpinner size={22} />
        ) : (
          <>
            <MaterialIcons name="search" size={20} color="#fff" />
            <Text style={styles.runTxt}>{kk.features.halalCheckRun}</Text>
          </>
        )}
      </Pressable>

      {checkErr ? (
        <View style={styles.errBox} accessibilityRole="alert">
          <MaterialIcons name="error-outline" size={18} color={colors.error} />
          <Text style={styles.err}>{checkErr}</Text>
        </View>
      ) : null}

      {photoAnalysisText ? (
        <View style={styles.visionBox}>
          <Text style={styles.visionTitle}>{kk.features.halalPhotoVisionTitle}</Text>
          <Text style={styles.visionBody} selectable>
            {photoAnalysisText}
          </Text>
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
      marginBottom: 12,
    },
    headTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "900",
      color: colors.text,
    },
    label: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.35,
      marginBottom: 6,
    },
    quickRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === "ios" ? 8 : 4,
      marginTop: 8,
    },
    quickInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      minHeight: 36,
    },
    hint: {
      fontSize: 11,
      lineHeight: 15,
      color: colors.muted,
      marginTop: 6,
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
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
      alignItems: "stretch",
    },
    actionTile: {
      flex: 1,
      minHeight: 88,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    actionLbl: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
    },
    multiline: {
      minHeight: 88,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      textAlignVertical: "top",
      marginBottom: 10,
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
    visionBox: {
      marginTop: 12,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.bg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    visionTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 6,
    },
    visionBody: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.text,
    },
  });
}
