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
  const raw = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(b|i|code)>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  if (!raw) return null;

  const structured = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^halal check pro/i.test(line));
  const hasStructuredHints = structured.some((line) =>
    /^(нәтиже|әрекет|ескерту|ингредиент|пайдалы белгі)\s*:/i.test(line)
  );
  if (hasStructuredHints) {
    return (
      <View>
        {structured.map((line, i) => {
          const m = line.match(/^([^:]{2,40})\s*:\s*(.+)$/);
          if (!m) {
            return (
              <Text key={i} style={styles.bodyPlain} selectable>
                {line}
              </Text>
            );
          }
          return (
            <View key={i} style={styles.kvRow}>
              <Text style={styles.kvKey}>{m[1]}</Text>
              <Text style={styles.kvVal} selectable>
                {m[2]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

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
    kvRow: {
      marginBottom: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kvKey: {
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.2,
      color: colors.accent,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    kvVal: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.text,
    },
  });
}
