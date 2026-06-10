import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { getKurbanAitDashboardTopics } from "../content/kurbanAitDashboardTopics";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import type { ThemeColors } from "../theme/colors";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  onTopicPress: (sectionId: string) => void;
  /** Толық экранда төменгі «Толық нұсқаулық» түймесі қажет емес */
  showOpenFullGuide?: boolean;
  onOpenFullGuide?: () => void;
};

export function KurbanAitTopicsPanel({
  colors,
  isDark,
  onTopicPress,
  showOpenFullGuide = false,
  onOpenFullGuide,
}: Props) {
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const topics = useMemo(() => getKurbanAitDashboardTopics(), []);
  const { tr } = useKkAutoTranslator();

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>{tr(kk.dashboard.kurbanAitTopicsHeading)}</Text>
      {topics.map((topic, index) => (
        <Pressable
          key={topic.id}
          oyuBackdrop={false}
          onPress={() => onTopicPress(topic.id)}
          style={({ pressed }) => [
            styles.topicRow,
            index === topics.length - 1 && styles.topicRowLast,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${topic.title}. ${topic.subtitle ?? kk.dashboard.promoHolidayKurbanOpenHint}`}
        >
          <View style={styles.topicTextCol}>
            <Text style={styles.topicTitle} numberOfLines={2}>
              {tr(topic.title)}
            </Text>
            {topic.subtitle ? (
              <Text style={styles.topicSub} numberOfLines={2}>
                {tr(topic.subtitle)}
              </Text>
            ) : null}
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>
      ))}
      {showOpenFullGuide && onOpenFullGuide ? (
        <Pressable
          oyuBackdrop={false}
          onPress={onOpenFullGuide}
          style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={kk.dashboard.kurbanAitOpenFullGuide}
        >
          <Text style={styles.footerBtnText}>{tr(kk.dashboard.kurbanAitOpenFullGuide)}</Text>
          <MaterialIcons name="menu-book" size={18} color={colors.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const cardBorder = isDark ? "rgba(34, 197, 94, 0.32)" : colors.border;
  return StyleSheet.create({
    panel: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: cardBorder,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 10,
      marginBottom: 14,
    },
    heading: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    topicRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    topicRowLast: {
      borderBottomWidth: 0,
    },
    topicTextCol: {
      flex: 1,
      minWidth: 0,
    },
    topicTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 18,
    },
    topicSub: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "600",
      lineHeight: 15,
      marginTop: 3,
    },
    footerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 10,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    footerBtnText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
    },
    pressed: {
      opacity: 0.9,
    },
  });
}
