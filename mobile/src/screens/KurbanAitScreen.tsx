import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KazakhOrnamentTitleBanner } from "../components/KazakhOrnamentTitleBanner";
import { KurbanAitTopicsPanel } from "../components/KurbanAitTopicsPanel";
import { KurbanAitTraditionGuide } from "../components/KurbanAitTraditionGuide";
import { getKurbanAitBlock } from "../content/kurbanAitBlockContent";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";

type Props = NativeStackScreenProps<MoreStackParamList, "KurbanAit">;

export function KurbanAitScreen({ navigation, route }: Props) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const block = useMemo(() => getKurbanAitBlock(), []);
  const { tr } = useKkAutoTranslator();
  const tg = kk.features.traditionGuide;
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const guideTopY = useRef(0);
  const pendingFocusId = useRef<string | null>(null);

  const tryScrollToFocus = useCallback(() => {
    const id = pendingFocusId.current ?? route.params?.focusSectionId;
    if (!id) return;
    const y = sectionY.current[id];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 10), animated: true });
    pendingFocusId.current = null;
    navigation.setParams({ focusSectionId: undefined });
  }, [navigation, route.params?.focusSectionId]);

  useEffect(() => {
    const id = route.params?.focusSectionId;
    if (!id) return;
    pendingFocusId.current = id;
    requestAnimationFrame(() => tryScrollToFocus());
  }, [route.params?.focusSectionId, tryScrollToFocus]);

  const onSectionLayout = useCallback(
    (sectionId: string, y: number) => {
      sectionY.current[sectionId] = guideTopY.current + y;
      tryScrollToFocus();
    },
    [tryScrollToFocus]
  );

  const scrollToTopic = useCallback(
    (sectionId: string) => {
      pendingFocusId.current = sectionId;
      const y = sectionY.current[sectionId];
      if (y != null) {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
        pendingFocusId.current = null;
        navigation.setParams({ focusSectionId: undefined });
      } else {
        requestAnimationFrame(() => tryScrollToFocus());
      }
    },
    [navigation, tryScrollToFocus]
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
      showsVerticalScrollIndicator
    >
      <KazakhOrnamentTitleBanner
        colors={colors}
        title={tr(block.title)}
        subtitle={tr(kk.features.kurbanAitTopicSub)}
        tone="traditionDeep"
      />
      <Text style={styles.intro}>{tr(kk.features.kurbanAitIntro)}</Text>
      <KurbanAitTopicsPanel colors={colors} isDark={isDark} onTopicPress={scrollToTopic} />
      <View
        collapsable={false}
        onLayout={(e) => {
          guideTopY.current = e.nativeEvent.layout.y;
        }}
      >
        <KurbanAitTraditionGuide
          colors={colors}
          block={block}
          tg={tg.kurbanAit}
          showInfographic={false}
          showSectionsInfographic
          infographicA11y={tg.kurbanInfographicA11y}
          hideTitleBanner
          onSectionLayout={onSectionLayout}
        />
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 14 },
    intro: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 12,
    },
  });
}
