import React, { useCallback, useLayoutEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { TajweedGuideHome } from "../components/TajweedGuideHub";
import { TajweedMuftyatBook } from "../components/TajweedMuftyatBook";
import { TAJWEED_APP_FIRST_PAGE } from "../content/tajweedMuftyatScope";

type Panel = "home" | "book";

export function TajweedGuideScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { colors } = useAppTheme();
  const [panel, setPanel] = useState<Panel>("home");
  const [bookStartPage, setBookStartPage] = useState(TAJWEED_APP_FIRST_PAGE);

  const goHome = useCallback(() => {
    setPanel("home");
    setBookStartPage(TAJWEED_APP_FIRST_PAGE);
  }, []);

  const openBookAt = useCallback((page: number) => {
    setBookStartPage(page);
    setPanel("book");
  }, []);

  useLayoutEffect(() => {
    if (panel === "home") {
      navigation.setOptions({
        headerLeft: undefined,
        headerTitle: kk.tajweedGuide.screenTitle,
      });
      return;
    }
    navigation.setOptions({
      headerTitle: kk.tajweedGuide.pagesHeading,
      headerLeft: () => (
        <Pressable
          oyuBackdrop={false}
          onPress={goHome}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 6,
            paddingRight: 10,
            opacity: pressed ? 0.72 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel={kk.common.back}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [colors.text, goHome, navigation, panel]);

  if (panel === "home") {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={styles.homeContent}
        keyboardShouldPersistTaps="handled"
      >
        <TajweedGuideHome onOpenPage={openBookAt} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.bookWrap}>
      <TajweedMuftyatBook key={`book-${bookStartPage}`} initialPage={bookStartPage} />
    </View>
  );
}

const styles = StyleSheet.create({
  homeContent: { flexGrow: 1 },
  bookWrap: { flex: 1 },
});
