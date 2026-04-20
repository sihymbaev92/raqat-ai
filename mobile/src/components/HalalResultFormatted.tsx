import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ThemeColors } from "../theme/colors";

type Props = {
  text: string;
  colors: ThemeColors;
};

/**
 * AI жауабындағы ## тақырыптарды визуалды бөліктерге бөледі (Markdown жеңіл).
 */
export function HalalResultFormatted({ text, colors }: Props) {
  const styles = makeStyles(colors);
  const raw = text.trim();
  if (!raw) return null;

  const chunks = raw.split(/\n(?=##\s)/);
  return (
    <View>
      {chunks.map((chunk, i) => {
        const c = chunk.trim();
        if (c.startsWith("##")) {
          const nl = c.indexOf("\n");
          const head = nl === -1 ? c.slice(2).trim() : c.slice(2, nl).trim();
          const body = nl === -1 ? "" : c.slice(nl + 1).trim();
          return (
            <View key={i} style={styles.section}>
              <Text style={styles.h2}>{head.replace(/^#+\s*/, "")}</Text>
              {body ? (
                <Text style={styles.body} selectable>
                  {body}
                </Text>
              ) : null}
            </View>
          );
        }
        return (
          <Text key={i} style={styles.bodyPlain} selectable>
            {c}
          </Text>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: { marginBottom: 12 },
    h2: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.accent,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    body: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.text,
    },
    bodyPlain: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.text,
      marginBottom: 10,
    },
  });
}
