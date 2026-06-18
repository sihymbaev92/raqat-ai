import React, { useState } from "react";
import { View, Text, Switch, type StyleProp, type ViewStyle } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { makeSettingsStyles } from "./settingsUi";

export function SettingsBoolRow({
  colors,
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  colors: ThemeColors;
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const styles = makeSettingsStyles(colors);
  return (
    <Pressable
      oyuBackdrop={false}
      disabled={disabled}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.rowBetween, disabled && { opacity: 0.5 }, pressed && { opacity: 0.9 }]}
    >
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={[styles.hint, { marginTop: 4, marginBottom: 0 }]}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} />
    </Pressable>
  );
}

export function SettingsChipGroup<T extends string>({
  colors,
  options,
  value,
  onChange,
  labelFor,
}: {
  colors: ThemeColors;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelFor: (id: T) => string;
}) {
  const styles = makeSettingsStyles(colors);
  return (
    <View style={styles.chipRow}>
      {options.map((id) => {
        const sel = value === id;
        return (
          <Pressable
            key={id}
            style={({ pressed }) => [styles.chip, sel && styles.chipActive, pressed && { opacity: 0.9 }]}
            onPress={() => onChange(id)}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={labelFor(id)}
          >
            <Text style={[styles.chipTxt, sel && styles.chipTxtActive]}>{labelFor(id)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SettingsChoiceRow({
  colors,
  label,
  selected,
  onPress,
}: {
  colors: ThemeColors;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = makeSettingsStyles(colors);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        selected && { borderColor: colors.accent, backgroundColor: colors.accentSurface },
        pressed && { opacity: 0.88 },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <MaterialIcons
        name={selected ? "check-circle" : "radio-button-unchecked"}
        size={22}
        color={selected ? colors.accent : colors.muted}
      />
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

export function SettingsScaleStepper({
  colors,
  valuePct,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
  decreaseA11y,
  increaseA11y,
  valueA11y,
}: {
  colors: ThemeColors;
  valuePct: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled: boolean;
  increaseDisabled: boolean;
  decreaseA11y: string;
  increaseA11y: string;
  valueA11y: string;
}) {
  const styles = makeStepperStyles(colors);
  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]}
        onPress={onDecrease}
        disabled={decreaseDisabled}
        accessibilityRole="button"
        accessibilityLabel={decreaseA11y}
      >
        <MaterialIcons name="remove" size={22} color={colors.accent} />
      </Pressable>
      <Text style={styles.value} accessibilityRole="text" accessibilityLabel={valueA11y}>
        {valuePct}%
      </Text>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]}
        onPress={onIncrease}
        disabled={increaseDisabled}
        accessibilityRole="button"
        accessibilityLabel={increaseA11y}
      >
        <MaterialIcons name="add" size={22} color={colors.accent} />
      </Pressable>
    </View>
  );
}

export function SettingsAccordion({
  colors,
  title,
  subtitle,
  defaultOpen = false,
  children,
  style,
}: {
  colors: ThemeColors;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = makeSettingsStyles(colors);
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[{ marginBottom: 10 }, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed && { opacity: 0.92 },
          { marginBottom: open ? 8 : 0 },
        ]}
        onPress={() => setOpen((p) => !p)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{title}</Text>
          {subtitle && !open ? (
            <Text style={[styles.hint, { marginTop: 4, marginBottom: 0 }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.chevronBox}>
          <MaterialIcons
            name={open ? "expand-less" : "expand-more"}
            size={22}
            color={colors.muted}
          />
        </View>
      </Pressable>
      {open ? <View style={{ gap: 8 }}>{children}</View> : null}
    </View>
  );
}

function makeStepperStyles(colors: ThemeColors) {
  return {
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    btn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    value: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "800" as const,
      minWidth: 56,
      textAlign: "center" as const,
      fontVariant: ["tabular-nums"] as ("tabular-nums")[],
    },
  };
}
