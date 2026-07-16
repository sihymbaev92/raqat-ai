import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, Platform, Alert } from "react-native";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { CameraView, useCameraPermissions, type CameraViewRef } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { modalSafeAreaInsets } from "../theme/modalSafeArea";
import { HALAL_BARCODE_TYPES, scanHalalBarcodeFromImageUri } from "../utils/halalBarcodeFromImage";

type Props = {
  visible: boolean;
  colors: ThemeColors;
  title: string;
  hint: string;
  photoHint: string;
  capturePhotoLabel: string;
  pickGalleryLabel: string;
  photoScanBusyLabel: string;
  photoNoBarcode: string;
  webUnavailable: string;
  camPermHint: string;
  camPermBtn: string;
  closeA11y: string;
  onClose: () => void;
  onBarcode: (data: string) => void;
};

/**
 * Штрихкод / QR — live scan + фото түсіру/галерея (expo-camera scanFromURLAsync).
 */
export function HalalBarcodeCameraModal({
  visible,
  colors,
  title,
  hint,
  photoHint,
  capturePhotoLabel,
  pickGalleryLabel,
  photoScanBusyLabel,
  photoNoBarcode,
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
  const cameraRef = useRef<CameraViewRef>(null);
  const [ready, setReady] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReady(false);
      setPhotoBusy(false);
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

  const deliverBarcode = useCallback(
    (data: string) => {
      const t = (data || "").trim();
      if (!t) return;
      onBarcode(t);
      onClose();
    },
    [onBarcode, onClose]
  );

  const onScan = useCallback(
    (data: string) => {
      const now = Date.now();
      if (now - lastScanRef.current < 1400) return;
      lastScanRef.current = now;
      deliverBarcode(data);
    },
    [deliverBarcode]
  );

  const decodePhotoUri = useCallback(
    async (uri: string) => {
      setPhotoBusy(true);
      try {
        const barcode = await scanHalalBarcodeFromImageUri(uri);
        if (barcode) {
          deliverBarcode(barcode);
          return;
        }
        Alert.alert(title, photoNoBarcode);
      } catch {
        Alert.alert(title, photoNoBarcode);
      } finally {
        setPhotoBusy(false);
      }
    },
    [deliverBarcode, photoNoBarcode, title]
  );

  const onCapturePhoto = useCallback(async () => {
    if (photoBusy || !cameraRef.current) return;
    setPhotoBusy(true);
    try {
      const shot = await cameraRef.current.takePicture({
        quality: 0.85,
        skipProcessing: Platform.OS === "android",
      });
      if (!shot?.uri) {
        Alert.alert(title, photoNoBarcode);
        return;
      }
      await decodePhotoUri(shot.uri);
    } catch {
      Alert.alert(title, photoNoBarcode);
      setPhotoBusy(false);
    }
  }, [decodePhotoUri, photoBusy, photoNoBarcode, title]);

  const onPickGallery = useCallback(async () => {
    if (photoBusy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(title, camPermHint);
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;
    await decodePhotoUri(picked.assets[0].uri);
  }, [camPermHint, decodePhotoUri, photoBusy, title]);

  const onPickGalleryWeb = useCallback(async () => {
    if (photoBusy) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;
    await decodePhotoUri(picked.assets[0].uri);
  }, [decodePhotoUri, photoBusy]);

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
            <Pressable
              onPress={() => void onPickGalleryWeb()}
              disabled={photoBusy}
              style={({ pressed }) => [
                styles.webPhotoBtn,
                { borderColor: colors.border, backgroundColor: colors.bg },
                pressed && !photoBusy && { opacity: 0.92 },
                photoBusy && { opacity: 0.65 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={pickGalleryLabel}
            >
              {photoBusy ? (
                <RaqatOrnamentSpinner size={22} />
              ) : (
                <>
                  <MaterialIcons name="photo-library" size={22} color={colors.accent} />
                  <Text style={[styles.webPhotoBtnTxt, { color: colors.text }]}>{pickGalleryLabel}</Text>
                </>
              )}
            </Pressable>
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
        <Text style={styles.photoHint}>{photoHint}</Text>
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
              ref={cameraRef as React.Ref<CameraView>}
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: HALAL_BARCODE_TYPES }}
              onBarcodeScanned={photoBusy ? undefined : ({ data }) => onScan(data)}
            />
            {photoBusy ? (
              <View style={styles.busyOverlay} accessibilityLiveRegion="polite">
                <RaqatOrnamentSpinner size={40} />
                <Text style={styles.busyTxt}>{photoScanBusyLabel}</Text>
              </View>
            ) : null}
            <View style={styles.bottomBar}>
              <Pressable
                onPress={() => void onPickGallery()}
                disabled={photoBusy}
                style={({ pressed }) => [styles.sideBtn, pressed && !photoBusy && { opacity: 0.88 }]}
                accessibilityRole="button"
                accessibilityLabel={pickGalleryLabel}
              >
                <MaterialIcons name="photo-library" size={26} color="#fff" />
                <Text style={styles.sideBtnTxt} numberOfLines={2}>
                  {pickGalleryLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void onCapturePhoto()}
                disabled={photoBusy}
                style={({ pressed }) => [
                  styles.shutterBtn,
                  pressed && !photoBusy && { opacity: 0.9 },
                  photoBusy && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={capturePhotoLabel}
              >
                <View style={styles.shutterInner} />
              </Pressable>
              <View style={styles.sideBtnPlaceholder} />
            </View>
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
    marginBottom: 4,
    zIndex: 2,
  },
  photoHint: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 17,
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
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    gap: 10,
  },
  busyTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 18,
    paddingTop: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sideBtn: {
    width: 88,
    alignItems: "center",
    gap: 4,
  },
  sideBtnTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  sideBtnPlaceholder: { width: 88 },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  webRoot: { flex: 1, justifyContent: "center", padding: 20 },
  webCard: { borderRadius: 16, padding: 20 },
  webTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  webHint: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  webPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  webPhotoBtnTxt: { fontSize: 15, fontWeight: "800" },
  webBtn: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 12 },
  webBtnTxt: { fontSize: 16, fontWeight: "800" },
});
