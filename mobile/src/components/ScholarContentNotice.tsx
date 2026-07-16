import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import type { ScholarReviewChecklist } from "../content/namazLearningContent";

type Props = {
  review: ScholarReviewChecklist;
  message: string;
  colors: ThemeColors;
};

/** Scholar review аяқталмаған контент үшін ескерту (approvedForPublicRelease=false). */
export function ScholarContentNotice({ review, message, colors }: Props) {
  if (review.approvedForPublicRelease) return null;
  return (
    <View style={[styles.root, { backgroundColor: colors.accentSurface, borderColor: colors.border }]}>
      <MaterialIcons name="school" size={20} color={colors.accent} />
      <Text style={[styles.txt, { color: colors.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  txt: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "600" },
});
