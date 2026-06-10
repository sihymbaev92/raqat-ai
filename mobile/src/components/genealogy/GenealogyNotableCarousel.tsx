import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../../i18n/kk";
import {
  genealogyEraLabel,
  genealogyLifeYears,
  type GenealogyPersonHit,
} from "../../services/genealogyLabels";
import { GENEALOGY_FEATURED_PERSON_SLUGS } from "../../services/genealogyBundledStats";
import { getTraditionKazakhPalette } from "../../theme/traditionKazakhTheme";
import { useAppTheme } from "../../theme/ThemeContext";

type Props = {
  persons: GenealogyPersonHit[];
  onPressPerson: (person: GenealogyPersonHit) => void;
};

export function GenealogyNotableCarousel({ persons, onPressPerson }: Props) {
  const { colors, isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(palette, colors), [palette, colors]);

  const featured = useMemo(() => {
    const bySlug = new Map(persons.map((p) => [p.slug, p]));
    const ordered: GenealogyPersonHit[] = [];
    for (const slug of GENEALOGY_FEATURED_PERSON_SLUGS) {
      const p = bySlug.get(slug);
      if (p) ordered.push(p);
    }
    if (ordered.length < 8) {
      for (const p of persons) {
        if (!ordered.some((x) => x.slug === p.slug)) ordered.push(p);
        if (ordered.length >= 12) break;
      }
    }
    return ordered.slice(0, 14);
  }, [persons]);

  if (featured.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{kk.features.genealogyNotableTitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {featured.map((p) => {
          const years = genealogyLifeYears(p);
          return (
            <Pressable
              key={p.slug}
              oyuBackdrop={false}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
              onPress={() => onPressPerson(p)}
              accessibilityRole="button"
              accessibilityLabel={p.name_kk}
            >
              <Text style={styles.name} numberOfLines={2}>
                {p.name_kk}
              </Text>
              {p.role_kk ? (
                <Text style={styles.role} numberOfLines={1}>
                  {p.role_kk}
                </Text>
              ) : null}
              <Text style={styles.meta} numberOfLines={1}>
                {[years, genealogyEraLabel(p.era)].filter(Boolean).join(" · ")}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(
  palette: ReturnType<typeof getTraditionKazakhPalette>,
  colors: ReturnType<typeof useAppTheme>["colors"],
) {
  return StyleSheet.create({
    wrap: { marginBottom: 12 },
    title: { color: colors.text, fontSize: 15, fontWeight: "800", marginBottom: 8 },
    row: { gap: 8, paddingRight: 4 },
    card: {
      width: 148,
      minHeight: 88,
      padding: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.cardBg,
    },
    name: { color: colors.text, fontSize: 13, fontWeight: "800", lineHeight: 17 },
    role: { color: palette.muted, fontSize: 11, marginTop: 4 },
    meta: { color: palette.gold, fontSize: 10, fontWeight: "700", marginTop: 6 },
  });
}
