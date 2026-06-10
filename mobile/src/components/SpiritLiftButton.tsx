import React, { useCallback, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { pickSpiritLift, type SpiritLiftQuote } from "../content/spiritLift";
export type SpiritLiftLabels = {
  title: string;
  subtitle: string;
  buttonA11y: string;
  another: string;
  fullRead: string;
  close: string;
  modalA11y: string;
};

type Props = {
  colors: ThemeColors;
  labels: SpiritLiftLabels;
  onOpenEntry?: (entryId: string) => void;
};

export function SpiritLiftButton({ colors, labels, onOpenEntry }: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState<SpiritLiftQuote | null>(null);

  const showQuote = useCallback((excludeText?: string) => {
    setQuote(pickSpiritLift(excludeText));
    setVisible(true);
  }, []);

  const another = useCallback(() => {
    setQuote((prev) => pickSpiritLift(prev?.text));
  }, []);

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.launch, pressed && { opacity: 0.92 }]}
        onPress={() => showQuote()}
        accessibilityRole="button"
        accessibilityLabel={labels.buttonA11y}
      >
        <Text style={styles.launchEyebrow}>✦</Text>
        <Text style={styles.launchTitle}>{labels.title}</Text>
        <Text style={styles.launchSub}>{labels.subtitle}</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        accessibilityViewIsModal
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
            accessibilityRole="button"
            accessibilityLabel={labels.close}
          />
          <View style={styles.sheet} accessibilityLabel={labels.modalA11y}>
            {quote ? (
              <>
                <Text style={styles.quote} selectable accessibilityRole="text">
                  «{quote.text}»
                </Text>
                <Text style={styles.attr} selectable>
                  — {quote.attribution}
                </Text>
              </>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.9 }]}
                onPress={another}
                accessibilityRole="button"
                accessibilityLabel={labels.another}
              >
                <Text style={styles.btnSecondaryTxt}>{labels.another}</Text>
              </Pressable>
              {quote?.entryId && onOpenEntry ? (
                <Pressable
                  style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.9 }]}
                  onPress={() => {
                    setVisible(false);
                    onOpenEntry(quote.entryId!);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={labels.fullRead}
                >
                  <Text style={styles.btnPrimaryTxt}>{labels.fullRead}</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.9 }]}
                  onPress={() => setVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel={labels.close}
                >
                  <Text style={styles.btnPrimaryTxt}>{labels.close}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    launch: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    launchEyebrow: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 4,
    },
    launchTitle: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "900",
    },
    launchSub: {
      color: "rgba(255,255,255,0.94)",
      fontSize: 13,
      lineHeight: 20,
      marginTop: 6,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      padding: 20,
    },
    sheet: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      maxWidth: 480,
      width: "100%",
      alignSelf: "center",
    },
    quote: {
      fontSize: 20,
      lineHeight: 30,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginVertical: 14,
    },
    attr: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      marginBottom: 8,
      fontStyle: "italic",
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 12,
      justifyContent: "center",
    },
    btnSecondary: {
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    btnSecondaryTxt: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.text,
    },
    btnPrimary: {
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.accent,
    },
    btnPrimaryTxt: {
      fontSize: 14,
      fontWeight: "800",
      color: "#fff",
    },
  });
}
