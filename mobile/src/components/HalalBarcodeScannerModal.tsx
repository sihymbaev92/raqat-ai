import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { extractProductCodeFromScan } from "../services/barcodeNormalize";

type Props = {
  visible: boolean;
  colors: ThemeColors;
  onClose: () => void;
  /** Сканерленген штрихкод мәнін береді (бір рет) */
  onBarcode: (data: string) => void;
};

/**
 * Тек штрихкод (EAN/UPC) — жапсырманы камераға тік ұстаңыз; тез оқу үшін.
 */
export function HalalBarcodeScannerModal({ visible, colors, onClose, onBarcode }: Props) {
  const { height: winH } = useWindowDimensions();
  const [perm, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const [warming, setWarming] = useState(true);

  const styles = makeStyles(colors, Math.min(winH * 0.42, 280));

  const handleBarcode = useCallback(
    (e: { data: string }) => {
      if (scannedRef.current) return;
      const raw = (e.data ?? "").trim();
      const fromUrl = /openfoodfacts\.org\/product\//i.test(raw);
      const digits = (extractProductCodeFromScan(raw) ?? raw.replace(/[^\d]/g, "")).trim();
      if (digits.length < 8 && !fromUrl) return;
      scannedRef.current = true;
      onBarcode(raw);
    },
    [onBarcode]
  );

  React.useEffect(() => {
    if (visible) {
      scannedRef.current = false;
      setWarming(true);
      const t = setTimeout(() => setWarming(false), 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
        <View style={styles.topBar}>
          <Text style={styles.title}>{kk.features.halalBarcodeTitle}</Text>
          <Pressable onPress={onClose} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={kk.common.cancel}>
            <MaterialIcons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
        <Text style={styles.hint}>{kk.features.halalBarcodeHint}</Text>

        {perm?.granted === false && !perm?.canAskAgain ? (
          <Text style={styles.err}>{kk.features.halalErrCamera}</Text>
        ) : perm?.granted ? (
          <View style={styles.camBox}>
            {warming ? (
              <View style={styles.warm}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarcodeScanned={handleBarcode}
                barcodeScannerSettings={{
                  barcodeTypes: [
                    "ean13",
                    "ean8",
                    "upc_a",
                    "upc_e",
                    "code128",
                    "code39",
                    "itf14",
                  ],
                }}
              />
            )}
            <View style={styles.reticle} pointerEvents="none" />
          </View>
        ) : (
          <Pressable style={styles.permBtn} onPress={() => void requestPermission()}>
            <Text style={styles.permBtnTxt}>{kk.features.halalBarcodeGrantCamera}</Text>
          </Pressable>
        )}

        {Platform.OS === "web" ? (
          <Text style={styles.webNote}>{kk.features.halalBarcodeWebNote}</Text>
        ) : null}
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors, reticleSize: number) {
  return StyleSheet.create({
    wrap: { flex: 1, paddingTop: Platform.OS === "ios" ? 8 : 12 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    title: { flex: 1, fontSize: 17, fontWeight: "800", color: colors.text },
    iconBtn: { padding: 8 },
    hint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    err: { color: "#b91c1c", paddingHorizontal: 16 },
    camBox: {
      flex: 1,
      marginHorizontal: 12,
      marginBottom: 24,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: colors.card,
      minHeight: 280,
    },
    warm: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    reticle: {
      position: "absolute",
      alignSelf: "center",
      top: "50%",
      marginTop: -reticleSize / 2,
      width: reticleSize,
      height: reticleSize * 0.45,
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.85)",
      borderRadius: 8,
    },
    permBtn: {
      margin: 16,
      padding: 16,
      backgroundColor: colors.accent,
      borderRadius: 12,
      alignItems: "center",
    },
    permBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
    webNote: { color: colors.muted, fontSize: 12, padding: 16, textAlign: "center" },
  });
}
