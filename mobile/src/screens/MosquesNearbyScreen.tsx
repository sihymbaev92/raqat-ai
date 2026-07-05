import React from "react";
import { StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NearbyMosquesPanel } from "../components/kmdb/NearbyMosquesPanel";
import { useAppTheme } from "../theme/ThemeContext";
import { useAppLocale } from "../i18n/runtime";
import type { MoreStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "MosquesNearby">;

/**
 * Жақын маңдағы мешіттер — 2GIS каталогы (ҚМДБ хабынан).
 */
export function MosquesNearbyScreen(_props: Props) {
  useAppLocale();
  const { colors } = useAppTheme();

  return (
    <View style={styles.root}>
      <NearbyMosquesPanel active colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
