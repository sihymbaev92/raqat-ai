from pathlib import Path
import re

p = Path(r"D:/opt/raqat-ai/mobile/src/screens/ContentGuideScreens.tsx")
text = p.read_text(encoding="utf-8")

start = text.index("  const visualSteps:")
end = text.index("  const closeOpenNamazPanel", text.index("  const [selectedPrayerCard"))
replacement = """  const [accOpen, setAccOpen] = useState<Record<string, boolean>>({});
  const [selectedPrayerCard, setSelectedPrayerCard] = useState<NamazPrayerTypeCardContent | null>(null);
"""
text = text[:start] + replacement + text[end:]

text = text.replace("import React, { useCallback, useMemo, useState } from \"react\";",
                    "import React, { useCallback, useState } from \"react\";")

text = text.replace("  type ImageSourcePropType,\n", "")

text = text.replace("{prayerTypeCards.map((card) => {", "{NAMAZ_PRAYER_TYPE_CARDS.map((card) => {")

text = text.replace("      {visualSteps.map((v) => {", "      {NAMAZ_POSE_VISUAL_STEPS.map((v) => {")

# rakat notes
old_rakat = """            {row.rakats.map((rakat) => (
              <Text key={`${row.key}-${rakat}`} style={styles.rakatLine}>
                {tr(rakat)}
              </Text>
            ))}
          </View>
        ))}"""
new_rakat = """            {row.rakats.map((rakat) => (
              <Text key={`${row.key}-${rakat}`} style={styles.rakatLine}>
                {tr(rakat)}
              </Text>
            ))}
            {row.notes.map((note) => (
              <Text key={`${row.key}-note-${note}`} style={styles.rakatNoteLine}>
                {tr(note)}
              </Text>
            ))}
          </View>
        ))}"""
if old_rakat in text:
    text = text.replace(old_rakat, new_rakat)

# pose actions from content file
old_pose = """              {(learnHints?.actions ?? []).map((a, i) => (
                <Text key={`${v.title}-act-${i}`} style={styles.namazPoseLearningLine}>
                  {tr(a)}
                </Text>
              ))}
              {(learnHints?.hints ?? []).map((h, i) => (
                <Text key={`${v.title}-hint-${i}`} style={styles.namazPoseLearningHint}>
                  {tr(h)}
                </Text>
              ))}"""
new_pose = """              {(v.actions.length ? v.actions : learnHints?.actions ?? []).map((a, i) => (
                <Text key={`${v.title}-act-${i}`} style={styles.namazPoseLearningLine}>
                  {tr(a)}
                </Text>
              ))}
              {(v.hints?.length ? v.hints : learnHints?.hints ?? []).map((h, i) => (
                <Text key={`${v.title}-hint-${i}`} style={styles.namazPoseLearningHint}>
                  {tr(h)}
                </Text>
              ))}"""
if old_pose in text:
    text = text.replace(old_pose, new_pose)

# remove jamaat dead branch
text = re.sub(
    r"\s*\) : isJamaat && jamaatGuideBody \? \(\s*<View style=\{styles\.stepReciteBox\}>\s*<Text style=\{styles\.stepReciteLine\}>\{tr\(jamaatGuideBody\)\}</Text>\s*</View>\s*\) : null",
    "\n              ) : null",
    text,
    count=1,
)
text = text.replace("        const isJamaat = v.title === \"Жамағат\";\n", "")

# prayer modal body
old_modal = """              <View style={styles.visualStepCardBody}>
                <Text style={styles.stepShortExplain}>{tr(selectedPrayerCard.subtitle)}</Text>
                <View style={styles.stepReciteBox}>
                  <Text style={styles.stepReciteLine}>{tr(selectedPrayerCard.body)}</Text>
                </View>
                <GuideAutoTranslateBanner colors={colors} visible={translated} />
              </View>"""
new_modal = """              <View style={styles.visualStepCardBody}>
                <Text style={styles.stepShortExplain}>{tr(selectedPrayerCard.lead)}</Text>
                {selectedPrayerCard.sections.map((section) => (
                  <View key={`${selectedPrayerCard.key}-${section.title}`} style={styles.block}>
                    <Text style={styles.blockTitle}>{tr(section.title)}</Text>
                    {section.lines.map((line) => (
                      <Text key={`${selectedPrayerCard.key}-${section.title}-${line}`} style={styles.blockBody}>
                        {tr(line)}
                      </Text>
                    ))}
                  </View>
                ))}
                <GuideAutoTranslateBanner colors={colors} visible={translated} />
              </View>"""
if old_modal in text:
    text = text.replace(old_modal, new_modal)

if "rakatNoteLine:" not in text:
    text = text.replace(
        "    rakatLine: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 4 },",
        "    rakatLine: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 4 },\n    rakatNoteLine: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },",
        1,
    )

p.write_text(text, encoding="utf-8")
print("patched")
