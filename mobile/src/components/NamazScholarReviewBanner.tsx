import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { NAMAZ_CONTENT_REVIEW } from "../content/namazLearningContent";
import { useI18n } from "../i18n/useI18n";

type Props = {
  colors: ThemeColors;
};

/** Намаз оқулығы: сарапшы review күйі (pending / approved). */
export function NamazScholarReviewBanner({ colors }: Props) {
  const t = useI18n();
  const review = NAMAZ_CONTENT_REVIEW;
  const approved = review.approvedForPublicRelease;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: approved ? colors.card : colors.accentSurface,
          borderColor: approved ? colors.accent : colors.border,
        },
      ]}
    >
      <MaterialIcons
        name={approved ? "verified" : "school"}
        size={22}
        color={colors.accent}
      />
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>
          {approved ? t.namazGuide.reviewBannerScholarApproved : t.namazGuide.reviewBannerScholarPending}
        </Text>
        <Text style={[styles.line, { color: colors.text }]}>
          {t.namazGuide.reviewBannerMadhhab(review.madhhab, "maturidi")}
        </Text>
        <Text style={[styles.line, { color: colors.muted }]}>
          {approved && review.reviewerName && review.reviewedAtIso
            ? `${review.reviewerName} · ${review.reviewedAtIso.slice(0, 10)}`
            : t.namazGuide.scholarReviewBanner}
        </Text>
        {!approved ? (
          <>
            <Text style={[styles.disclaimer, { color: colors.muted }]}>
              {t.namazGuide.reviewBannerDisclaimer}
            </Text>
            {review.checklist.map((item) => (
              <Text key={item} style={[styles.checkItem, { color: colors.muted }]}>
                • {item}
              </Text>
            ))}
          </>
        ) : (
          <Text style={[styles.disclaimer, { color: colors.muted }]}>
            {t.namazGuide.reviewBannerDisclaimer}
          </Text>
        )}
      </View>
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
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontWeight: "800", lineHeight: 20 },
  line: { fontSize: 12, lineHeight: 17 },
  disclaimer: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  checkItem: { fontSize: 11, lineHeight: 16, marginLeft: 4 },
});
