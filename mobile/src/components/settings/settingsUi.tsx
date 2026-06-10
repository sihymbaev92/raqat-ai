import React from "react";
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import type { MaterialIcons } from "@expo/vector-icons";
import MaterialIconsLib from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { useAppTheme } from "../../theme/ThemeContext";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";

function useSettingsColors(colors?: ThemeColors): ThemeColors {
  const { colors: themeColors } = useAppTheme();
  return colors ?? themeColors;
}

export function SettingsSection({
  title,
  subtitle,
  children,
  colors: colorsProp,
  style,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  colors?: ThemeColors;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useSettingsColors(colorsProp);
  const styles = makeSettingsStyles(colors);
  const { tr } = useKkAutoTranslator();
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{tr(title)}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{tr(subtitle)}</Text> : null}
      {children}
    </View>
  );
}

export function SettingsCard({
  children,
  colors: colorsProp,
  style,
  panel = false,
}: {
  children: React.ReactNode;
  colors?: ThemeColors;
  style?: StyleProp<ViewStyle>;
  /** Бірнеше өріс/батырма тобы — жеке карточка қоршауы */
  panel?: boolean;
}) {
  const colors = useSettingsColors(colorsProp);
  const styles = makeSettingsStyles(colors);
  return <View style={[panel ? styles.cardPanel : styles.card, style]}>{children}</View>;
}

export function SettingsRow({
  label,
  value,
  onPress,
  colors: colorsProp,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  colors?: ThemeColors;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useSettingsColors(colorsProp);
  const styles = makeSettingsStyles(colors);
  const { tr } = useKkAutoTranslator();
  const inner = (
    <>
      <Text style={[styles.rowLabel, disabled && styles.dimmed]} numberOfLines={2}>
        {tr(label)}
      </Text>
      {value != null ? <Text style={styles.rowValue}>{tr(value)}</Text> : null}
      {onPress ? <Text style={styles.chev}>›</Text> : null}
    </>
  );
  if (!onPress) {
    return <View style={styles.row}>{inner}</View>;
  }
  return (
    <Pressable
      oyuBackdrop={false}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {inner}
    </Pressable>
  );
}

/** Референс стилі: бір карточка ішінде иконкалы жолдар. */
export function SettingsIconCard({
  children,
  colors: colorsProp,
  style,
}: {
  children: React.ReactNode;
  colors?: ThemeColors;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useSettingsColors(colorsProp);
  const styles = makeSettingsStyles(colors);
  return <View style={[styles.iconCard, style]}>{children}</View>;
}

export function SettingsIconRow({
  icon,
  label,
  value,
  onPress,
  colors: colorsProp,
  disabled,
  accessibilityLabel,
  last,
}: {
  icon: React.ComponentProps<typeof MaterialIconsLib>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  colors?: ThemeColors;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Соңғы жол — төменгі бөлгіш жоқ */
  last?: boolean;
}) {
  const colors = useSettingsColors(colorsProp);
  const styles = makeSettingsStyles(colors);
  const { tr } = useKkAutoTranslator();
  const inner = (
    <>
      <MaterialIconsLib name={icon} size={22} color={colors.accent} style={styles.iconRowGlyph} />
      <Text style={[styles.iconRowLabel, disabled && styles.dimmed]} numberOfLines={2}>
        {tr(label)}
      </Text>
      {value != null ? (
        <Text style={styles.iconRowValue} numberOfLines={1}>
          {tr(value)}
        </Text>
      ) : null}
      {onPress ? (
        <MaterialIconsLib name="chevron-right" size={22} color={colors.muted} />
      ) : null}
    </>
  );
  const rowStyle = [styles.iconRow, !last && styles.iconRowDivider, disabled && { opacity: 0.5 }];
  if (!onPress) {
    return <View style={rowStyle}>{inner}</View>;
  }
  return (
    <Pressable
      oyuBackdrop={false}
      style={({ pressed }) => [rowStyle, pressed && { opacity: 0.9 }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {inner}
    </Pressable>
  );
}

/** Тема таңдау: вертикаль тізім, таңдалғанда галочка. */
export function SettingsRadioList<T extends string>({
  options,
  value,
  onChange,
  colors: colorsProp,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  colors?: ThemeColors;
}) {
  const colors = useSettingsColors(colorsProp);
  const styles = makeSettingsStyles(colors);
  const { tr } = useKkAutoTranslator();
  return (
    <View style={styles.iconCard}>
      {options.map((opt, i) => {
        const sel = value === opt.id;
        const last = i === options.length - 1;
        return (
          <Pressable
            key={opt.id}
            style={({ pressed }) => [
              styles.iconRow,
              !last && styles.iconRowDivider,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => onChange(opt.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={opt.label}
          >
            <Text style={[styles.iconRowLabel, { marginLeft: 0 }]}>{tr(opt.label)}</Text>
            {sel ? (
              <MaterialIconsLib name="check-circle" size={22} color={colors.accent} />
            ) : (
              <View style={{ width: 22 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function makeSettingsStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: { marginBottom: 22 },
    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    sectionSub: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 10,
    },
    card: {
      gap: 8,
    },
    cardPanel: {
      gap: 10,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    rowLabel: { color: colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
    rowValue: { color: colors.muted, fontSize: 14, fontWeight: "600", maxWidth: "42%" },
    chev: { color: colors.muted, fontSize: 18, marginLeft: 4 },
    dimmed: { opacity: 0.55 },
    hint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8, paddingHorizontal: 2 },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: colors.bg,
    },
    chipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    chipTxt: { color: colors.muted, fontSize: 13, fontWeight: "700" },
    chipTxtActive: { color: colors.accent },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 12,
    },
    label: { color: colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
    chevronBox: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    iconCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
      marginBottom: 12,
    },
    iconRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
      minHeight: 52,
    },
    iconRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    iconRowGlyph: { flexShrink: 0 },
    iconRowLabel: { color: colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
    iconRowValue: { color: colors.muted, fontSize: 14, fontWeight: "600", maxWidth: "36%" },
  });
}
