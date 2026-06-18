import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, Platform } from "react-native";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { modalSafeAreaInsets } from "../theme/modalSafeArea";

type Props = {
  visible: boolean;
  colors: ThemeColors;
  title: string;
  hint: string;
  webUnavailable: string;
  camPermHint: string;
  camPermBtn: string;
  closeA11y: string;
  onClose: () => void;
  onBarcode: (data: string) => void;
};

/**
 * Штрихкод / QR — тек native (expo-camera). Вебте қолжетімсіз.
 */
export function HalalBarcodeCameraModal({
  visible,
  colors,
  title,
  hint,
  webUnavailable,
  camPermHint,
  camPermBtn,
  closeA11y,
  onClose,
  onBarcode,
}: Props) {
  const insets = useSafeAreaInsets();
  const modalInsets = modalSafeAreaInsets(insets);
  const [permission, requestPermission] = useCameraPermissions();
  const lastScanRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReady(false);
      return;
    }
    if (Platform.OS === "web") return;
    void (async () => {
      if (!permission?.granted) {
        const r = await requestPermission();
        if (!r.granted) return;
      }
      setReady(true);
    })();
  }, [visible, permission?.granted, requestPermission]);

  const onScan = useCallback(
    (data: string) => {
      const now = Date.now();
      if (now - lastScanRef.current < 1400) return;
      lastScanRef.current = now;
      const t = (data || "").trim();
      if (!t) return;
      onBarcode(t);
      onClose();
    },
    [onBarcode, onClose]
  );

  if (!visible) return null;

  if (Platform.OS === "web") {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <View
          style={[
            styles.webRoot,
            {
              paddingTop: modalInsets.top + 12,
              paddingBottom: modalInsets.bottom + 12,
              backgroundColor: "rgba(0,0,0,0.55)",
            },
          ]}
        >
          <View style={[styles.webCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.webTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.webHint, { color: colors.muted }]}>{webUnavailable}</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.webBtn, pressed && { opacity: 0.9 }]}>
              <Text style={[styles.webBtnTxt, { color: colors.accent }]}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View
        style={[
          styles.root,
          { paddingTop: modalInsets.top, paddingBottom: modalInsets.bottom, backgroundColor: "#000" },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={closeA11y}
          >
            <MaterialIcons name="close" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <Text style={styles.hint}>{hint}</Text>
        {!permission?.granted ? (
          <View style={styles.centerBox}>
            <Text style={styles.permTxt}>{camPermHint}</Text>
            <Pressable onPress={() => void requestPermission()} style={styles.permBtn}>
              <Text style={styles.permBtnTxt}>{camPermBtn}</Text>
            </Pressable>
          </View>
        ) : ready ? (
          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: [
                  "qr",
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code128",
                  "code39",
                  "pdf417",
                  "aztec",
                ],
              }}
              onBarcodeScanned={({ data }) => onScan(data)}
            />
          </View>
        ) : (
          <View style={styles.centerBox}>
            <RaqatOrnamentSpinner size={48} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
    zIndex: 2,
  },
  iconBtn: { padding: 10 },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  hint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    paddingHorizontal: 18,
    marginBottom: 8,
    zIndex: 2,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permTxt: { color: "#fff", fontSize: 15, marginBottom: 16, textAlign: "center" },
  permBtn: { backgroundColor: "#2e7d32", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  permBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  webRoot: { flex: 1, justifyContent: "center", padding: 20 },
  webCard: { borderRadius: 16, padding: 20 },
  webTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  webHint: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  webBtn: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 12 },
  webBtnTxt: { fontSize: 16, fontWeight: "800" },
});
