import React from "react";
import { LayoutAnimation, Platform, StyleSheet, Text, UIManager, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";

type Props = {
  colors: ThemeColors;
  palette?: TraditionKazakhPalette;
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  variant?: "section" | "pocket";
  action?: "toggle" | "navigate";
};

function animateToggle() {
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export function TraditionAccordion({
  colors,
  palette,
  title,
  subtitle,
  expanded,
  onToggle,
  children,
  variant = "pocket",
  action = "toggle",
}: Props) {
  const styles = React.useMemo(() => makeStyles(colors, palette, variant), [colors, palette, variant]);
  const chevronColor = palette?.gold ?? colors.accent;
  const isNavigateAction = action === "navigate";

  return (
    <View style={styles.wrap}>
      <Pressable
        oyuBackdrop={false}
        style={({ pressed }) => [styles.head, pressed && { opacity: 0.9 }]}
        onPress={() => {
          if (!isNavigateAction) animateToggle();
          onToggle();
        }}
        accessibilityRole="button"
        accessibilityState={isNavigateAction ? undefined : { expanded }}
        accessibilityLabel={title}
      >
        <View style={styles.headTextCol}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle && !expanded ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <MaterialIcons
          name={isNavigateAction ? "chevron-right" : expanded ? "expand-less" : "expand-more"}
          size={24}
          color={chevronColor}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </Pressable>
      {expanded ? <View style={styles.bodyPanel}>{children}</View> : null}
    </View>
  );
}

function makeStyles(
  colors: ThemeColors,
  palette: TraditionKazakhPalette | undefined,
  variant: "section" | "pocket"
) {
  const isSection = variant === "section";
  const p = palette;
  return StyleSheet.create({
    wrap: {
      marginBottom: isSection ? 12 : 8,
      gap: 8,
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: isSection ? 14 : 10,
      paddingHorizontal: 14,
      borderRadius: isSection ? 16 : 14,
      borderWidth: 1,
      borderColor: p?.border ?? colors.border,
      backgroundColor: isSection ? (p?.brown ?? colors.card) : (p?.goldSurface ?? colors.accentSurface),
    },
    headTextCol: { flex: 1, minWidth: 0 },
    title: {
      color: isSection && p ? p.headerText : colors.text,
      fontSize: isSection ? 16 : 15,
      fontWeight: "800",
    },
    subtitle: {
      color: isSection && p ? p.headerSubtext : colors.muted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 4,
      fontWeight: "600",
    },
    bodyPanel: isSection
      ? {
          paddingHorizontal: 0,
          paddingBottom: 4,
          paddingTop: 8,
          borderWidth: 0,
          backgroundColor: "transparent",
        }
      : {
          paddingHorizontal: 12,
          paddingBottom: 12,
          paddingTop: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: p?.border ?? colors.border,
          backgroundColor: p?.cardBg ?? colors.accentSurface,
        },
  });
}
