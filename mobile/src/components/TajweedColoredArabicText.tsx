import React from "react";
import { Text, type TextStyle } from "react-native";
import { tajweedColorForRule } from "../content/tajweedRulesCatalog";
import { parseAlquranTajweedTaggedText, type TajweedRuleKey } from "../utils/alquranTajweedParse";

type Props = {
  taggedText: string;
  baseStyle: TextStyle;
  isDark: boolean;
};

export function TajweedColoredArabicText({ taggedText, baseStyle, isDark }: Props) {
  const raw = (taggedText ?? "").trim();
  if (!raw) return null;

  const hasTag = raw.includes("[");
  if (!hasTag) {
    return <Text style={baseStyle}>{raw}</Text>;
  }

  const segments = parseAlquranTajweedTaggedText(raw);
  return (
    <Text style={baseStyle}>
      {segments.map((seg, idx) => {
        if (!seg.rule) {
          return (
            <Text key={`p-${idx}`} style={baseStyle}>
              {seg.text}
            </Text>
          );
        }
        const color = tajweedColorForRule(seg.rule as TajweedRuleKey, isDark);
        /** Тек түс: ішкі Text-ке басқа fontWeight қоймаңыз — RTL/arabAyahFont метрикалары өзгеріп,
         *  сегмент шекарасында жол «бөлініп» кетуі мүмкін (Android / web). */
        return (
          <Text key={`r-${idx}-${seg.rule}`} style={[baseStyle, { color }]}>
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}
