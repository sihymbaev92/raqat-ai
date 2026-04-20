import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { ThemeColors } from "../theme/colors";

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
  const styles = makeStyles(colors);
  const a11y = expanded ? `${title} — жасыру` : `${title} — ашу`;
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.head, pressed && styles.headPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={a11y}
      >
        <View style={styles.headTextCol}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={3}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginBottom: 10, alignSelf: "stretch" },
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
    sub: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
    chevron: { color: colors.accent, fontSize: 16, fontWeight: "800", paddingLeft: 4 },
    body: {
      marginTop: 10,
      paddingHorizontal: 4,
      paddingBottom: 4,
      alignSelf: "stretch",
    },
  });
}
