import React, { useCallback, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { SettingsSection, SettingsCard, SettingsRow, makeSettingsStyles } from "./settingsUi";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { getQiblaMotionMode, setQiblaMotionMode, type QiblaMotionMode } from "../../storage/prefs";

type Props = { colors: ThemeColors; onOpenQibla: () => void };

export function SettingsQiblaSection({ colors, onOpenQibla }: Props) {
  const styles = makeSettingsStyles(colors);
  const [mode, setMode] = useState<QiblaMotionMode>("balanced");

  const load = useCallback(async () => {
    setMode(await getQiblaMotionMode());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pick = (m: QiblaMotionMode) => {
    setMode(m);
    void setQiblaMotionMode(m);
  };

  return (
    <SettingsSection colors={colors} title={kk.settings.sectionQibla} subtitle={kk.settings.sectionQiblaSub}>
      <SettingsCard colors={colors}>
        <View style={styles.chipRow}>
          <Pressable
            style={({ pressed }) => [
              styles.chip,
              mode === "balanced" && styles.chipActive,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => pick("balanced")}
          >
            <Text style={[styles.chipTxt, mode === "balanced" && styles.chipTxtActive]}>
              {kk.settings.qiblaMotionBalanced}
            </Text>
          </Pressable>
        </View>
        <SettingsRow colors={colors} label={kk.tabs.qibla} onPress={onOpenQibla} />
      </SettingsCard>
    </SettingsSection>
  );
}
