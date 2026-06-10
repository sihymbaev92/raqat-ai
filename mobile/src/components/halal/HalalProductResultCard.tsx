import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { HalalCertBadge } from "../HalalCertBadge";
import { halalCertBadgeColors, halalCertTone } from "../../utils/halalCertDisplay";
import { kk } from "../../i18n/kk";

type ProductProps = {
  kind: "product";
  colors: ThemeColors;
  isDark: boolean;
  title: string;
  barcode?: string | null;
  certificateStatus?: string | null;
  verificationStatus?: "official_product" | "raqat_reference" | "certified_producer";
  producerCertificateStatus?: string | null;
  subtitle?: string;
  onPress?: () => void;
  onCopyBarcode?: () => void;
};

type AdditiveProps = {
  kind: "additive";
  colors: ThemeColors;
  isDark: boolean;
  title: string;
  description?: string | null;
  onPress: () => void;
};

type Props = ProductProps | AdditiveProps;

export function HalalProductResultCard(props: Props) {
  const { colors, isDark } = props;
  const tone = props.kind === "product" ? halalCertTone(props.certificateStatus) : "neutral";
  const accent = halalCertBadgeColors(tone, isDark).dot;
  const styles = useMemo(() => makeStyles(colors, accent), [colors, accent]);

  if (props.kind === "additive") {
    return (
      <Pressable
        onPress={props.onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={props.title}
      >
        <View style={styles.accentBar} />
        <MaterialIcons name="science" size={20} color={colors.accent} />
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {props.title}
          </Text>
          {props.description ? (
            <Text style={styles.sub} numberOfLines={3}>
              {props.description}
            </Text>
          ) : null}
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
      </Pressable>
    );
  }

  const verificationLabel =
    props.verificationStatus === "official_product"
      ? kk.features.halalProductOfficialLabel
      : props.verificationStatus === "certified_producer"
        ? kk.features.halalProductProducerFallbackLabel
        : props.verificationStatus === "raqat_reference"
          ? kk.features.halalProductSeedLabel
          : null;
  const producerLine =
    props.producerCertificateStatus && props.verificationStatus !== "official_product"
      ? `${kk.features.halalProductProducerCertPrefix}: ${props.producerCertificateStatus}`
      : null;

  return (
    <Pressable
      onPress={props.onPress}
      disabled={!props.onPress}
      style={({ pressed }) => [styles.card, props.onPress && pressed && styles.pressed]}
      accessibilityRole={props.onPress ? "button" : undefined}
      accessibilityLabel={props.title}
    >
      <View style={styles.accentBar} />
      <MaterialIcons name="inventory-2" size={20} color={colors.accent} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {props.title}
        </Text>
        {props.subtitle ? (
          <Text style={styles.sub} numberOfLines={1}>
            {props.subtitle}
          </Text>
        ) : props.barcode ? (
          <Text style={styles.sub} numberOfLines={1}>
            {props.barcode}
          </Text>
        ) : null}
        {verificationLabel ? (
          <Text style={styles.verification} numberOfLines={1}>
            {verificationLabel}
          </Text>
        ) : null}
        {producerLine ? (
          <Text style={styles.producerStatus} numberOfLines={1}>
            {producerLine}
          </Text>
        ) : null}
        <HalalCertBadge status={props.certificateStatus} colors={colors} isDark={isDark} compact />
      </View>
      {props.barcode && props.onCopyBarcode ? (
        <Pressable
          onPress={props.onCopyBarcode}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={kk.features.halalProductCopyBarcode}
          style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.75 : 1 }]}
        >
          <MaterialIcons name="content-copy" size={20} color={colors.accent} />
        </Pressable>
      ) : props.onPress ? (
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
      ) : null}
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors, accent: string) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      paddingLeft: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 8,
      overflow: "hidden",
    },
    pressed: {
      opacity: 0.92,
    },
    accentBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: accent,
    },
    body: {
      flex: 1,
      minWidth: 0,
      paddingLeft: 4,
    },
    title: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.text,
      lineHeight: 18,
    },
    sub: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
      fontVariant: ["tabular-nums"],
    },
    verification: {
      marginTop: 4,
      fontSize: 10.5,
      fontWeight: "800",
      color: accent,
    },
    producerStatus: {
      marginTop: 2,
      fontSize: 10.5,
      fontWeight: "700",
      color: colors.muted,
    },
  });
}
