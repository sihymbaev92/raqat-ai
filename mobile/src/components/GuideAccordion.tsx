import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";

type Props = {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colors: ThemeColors;
};

/**
 * Оқулық тараулары: жоғарыда тақырып (және қосымша бір жол), басқанда астында мазмұн.
 */
export function GuideAccordionSection({
  title,
  subtitle,
  expanded,
  onToggle,
  children,
  colors,
}: Props) {
  useAppLocale();
  const styles = makeStyles(colors);
  const a11y = expanded
    ? `${title} — ${kk.common.guideAccordionCollapse}`
    : `${title} — ${kk.common.guideAccordionExpand}`;
  return (
    <View style={styles.wrap}>
      <Pressable
        oyuBackdrop={false}
        onPress={onToggle}
        style={({ pressed }) => [styles.head, pressed && styles.headPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={a11y}
      >
        <View style={styles.headTextCol}>
          <Text style={[styles.title, expanded && styles.titleExpanded]}>{title}</Text>
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={3}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.chevronBox}>
          <MaterialIcons
            name={expanded ? "expand-less" : "expand-more"}
            size={22}
            color={colors.accent}
          />
        </View>
      </Pressable>
      {expanded ? <View style={styles.bodyPanel}>{children}</View> : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginBottom: 12, alignSelf: "stretch", gap: 8 },
    head: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    headPressed: { opacity: 0.92 },
    headTextCol: { flex: 1, minWidth: 0 },
    title: { color: colors.accent, fontWeight: "800", fontSize: 15, lineHeight: 21 },
    titleExpanded: { color: colors.text },
    sub: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
    chevronBox: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    bodyPanel: {
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignSelf: "stretch",
    },
  });
}
