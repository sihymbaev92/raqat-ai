import React, { useState } from "react";
import { Text, StyleSheet, ScrollView } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { HAJJ_SECTIONS } from "../content/spiritualContent";
import { GuideAccordionSection } from "../components/GuideAccordion";

function SectionedGuide({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: string;
  sections: { title: string; body: string }[];
}) {
  const { colors } = useAppTheme();
  const styles = makeGuideStyles(colors);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{title}</Text>
      {intro ? <Text style={styles.intro}>{intro}</Text> : null}
      {sections.map((s, i) => {
        const key = `sec-${i}`;
        return (
          <GuideAccordionSection
            key={`hajj-sec-${i}-${s.title}`}
            title={s.title}
            expanded={!!open[key]}
            onToggle={() => toggle(key)}
            colors={colors}
          >
            <Text style={styles.blockBody}>{s.body}</Text>
          </GuideAccordionSection>
        );
      })}
    </ScrollView>
  );
}

export function HajjScreen() {
  return (
    <SectionedGuide title={kk.features.hajjTitle} intro={kk.features.hajjIntro} sections={HAJJ_SECTIONS} />
  );
}

function makeGuideStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 18, paddingBottom: 40 },
    h1: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 10 },
    intro: { fontSize: 14, lineHeight: 22, color: colors.muted, marginBottom: 16 },
    blockBody: { color: colors.text, fontSize: 15, lineHeight: 24 },
  });
}

