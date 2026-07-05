import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { KmdbOfficialSitesPanel } from "../components/kmdb/KmdbOfficialSitesPanel";
import { TabHomeBackButton, useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { useAppTheme } from "../theme/ThemeContext";

/** Негізгі таб: ҚМДБ — Muftyat / Fatua / мешіттер. */
export function KmdbTabScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  useTabHomeBackHeader(navigation, colors);

  return (
    <View style={styles.root} testID="screen-main-articles">
      {navigation.canGoBack() ? (
        <View style={styles.backRow}>
          <TabHomeBackButton navigation={navigation} colors={colors} />
        </View>
      ) : null}
      <KmdbOfficialSitesPanel colors={colors} inlineToolbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backRow: { paddingHorizontal: 12, paddingTop: 4 },
});
