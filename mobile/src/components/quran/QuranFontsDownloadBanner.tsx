import React, { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/AppThemeContext";
import { kk } from "../i18n/kk";
import { isQuranBookFontsReady } from "../fonts/quranBookFonts";
import { isQcf4FontPackCached } from "../services/quranFontCache";

type Props = {
  variant: "book" | "qcf4" | "any";
};

export function QuranFontsDownloadBanner({ variant }: Props) {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [bookReady, setBookReady] = useState(true);
  const [qcf4Ready, setQcf4Ready] = useState(true);

  const refresh = useCallback(async () => {
    const [book, qcf4] = await Promise.all([isQuranBookFontsReady(), isQcf4FontPackCached()]);
    setBookReady(book);
    setQcf4Ready(qcf4);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const needsBook = variant === "book" || variant === "any";
  const needsQcf4 = variant === "qcf4" || variant === "any";
  const show =
    (needsBook && !bookReady) || (needsQcf4 && !qcf4Ready);

  if (!show) return null;

  const message =
    !bookReady && !qcf4Ready
      ? kk.settings.quranFontsDownloadBothHint
      : !bookReady
        ? kk.settings.quranFontsDownloadBookHint
        : kk.settings.quranFontsDownloadQcf4Hint;

  return (
    <Pressable
      onPress={() => navigation.navigate("QuranSettings")}
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={kk.settings.quranFontsDownloadCta}
    >
      <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 4 }}>
        {kk.settings.quranFontsDownloadTitle}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>{message}</Text>
      <View style={{ marginTop: 8 }}>
        <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
          {kk.settings.quranFontsDownloadCta}
        </Text>
      </View>
    </Pressable>
  );
}
