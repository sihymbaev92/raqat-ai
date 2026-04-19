import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CommonActions, useFocusEffect, useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardOffset } from "../hooks/useKeyboardOffset";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getRaqatAiSecret } from "../config/raqatAiSecret";
import { getValidAccessToken } from "../storage/authTokens";
import {
  fetchPlatformAiChat,
  fetchPlatformAiAnalyzeImage,
} from "../services/platformApiClient";
import { formatAiApiError } from "../utils/formatAiApiError";
import { buildHalalImagePrompt, buildHalalTextPrompt } from "../content/halalAiPrompts";

export function HalalScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const keyboardOffset = useKeyboardOffset();
  const styles = makeStyles(colors);
  const scrollBottomPad =
    28 +
    Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0) +
    (Platform.OS === "android" ? keyboardOffset : 0);
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [aiReady, setAiReady] = useState(false);

  const base = getRaqatApiBase().trim();
  const localhostBase =
    Boolean(base) &&
    (base.includes("127.0.0.1") || base.toLowerCase().includes("localhost"));

  /**
   * Халал AI үшін авторизация екі жолмен:
   * 1) X-Raqat-Ai-Secret (EXPO_PUBLIC_RAQAT_AI_SECRET / app.json extra) — RAQAT_AI_PROXY_SECRET-пен сәйкес;
   * 2) Құпия жоқ болса — Authorization: Bearer access token (Google/Apple кіру JWT, серверде scope «ai» болуы керек).
   * @see platform_api/ai_security.py require_ai_access
   */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const b = getRaqatApiBase().trim();
        const sec = getRaqatAiSecret().trim();
        const tok = (await getValidAccessToken())?.trim() ?? "";
        if (!cancelled) setAiReady(Boolean(b && (sec || tok)));
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const configured = aiReady;

  const openSettingsTab = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "MoreStack",
        params: { screen: "Settings" },
      })
    );
  }, [navigation]);

  const runText = useCallback(async () => {
    const t = text.trim();
    if (!t || !configured) return;
    setErr("");
    setResult("");
    setLoading(true);
    try {
      const sec = getRaqatAiSecret().trim();
      const bearer = (await getValidAccessToken())?.trim() ?? "";
      if (!sec && !bearer) {
        setErr(kk.aiChat.configBody);
        return;
      }
      const res = await fetchPlatformAiChat(base, buildHalalTextPrompt(t), {
        aiSecret: sec || undefined,
        authorizationBearer: sec ? undefined : bearer || undefined,
        timeoutMs: 90_000,
      });
      if (!res.ok || res.status === 401 || res.status === 403) {
        setErr(formatAiApiError(res.status, res));
        return;
      }
      if (res.text) setResult(res.text.trim());
      else setErr(kk.aiChat.error);
    } finally {
      setLoading(false);
    }
  }, [base, configured, text]);

  const pickImage = useCallback(async () => {
    if (!configured) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErr(kk.features.halalErrGallery);
      return;
    }
    setErr("");
    setResult("");
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      /** Төменірек — жүктеу жылдамырақ, модель үшін жеткілікті */
      quality: 0.62,
      base64: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const a = picked.assets[0];
    const b64 = a.base64;
    if (!b64) {
      setErr(kk.features.halalErrBase64);
      return;
    }
    const mime = a.mimeType ?? "image/jpeg";
    setLoading(true);
    try {
      const sec = getRaqatAiSecret().trim();
      const bearer = (await getValidAccessToken())?.trim() ?? "";
      if (!sec && !bearer) {
        setErr(kk.aiChat.configBody);
        return;
      }
      const res = await fetchPlatformAiAnalyzeImage(
        base,
        { image_b64: b64, mime_type: mime, lang: "kk", prompt: buildHalalImagePrompt() },
        {
          aiSecret: sec || undefined,
          authorizationBearer: sec ? undefined : bearer || undefined,
          timeoutMs: 90_000,
        }
      );
      if (!res.ok || res.status === 401 || res.status === 403) {
        setErr(formatAiApiError(res.status, res));
        return;
      }
      if (res.text) setResult(res.text.trim());
      else setErr(res.error ?? kk.aiChat.error);
    } finally {
      setLoading(false);
    }
  }, [base, configured]);

  const captureImage = useCallback(async () => {
    if (!configured) return;
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      setErr(kk.features.halalErrCamera);
      return;
    }
    setErr("");
    setResult("");
    const shot = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.62,
      base64: true,
    });
    if (shot.canceled || !shot.assets?.[0]) return;
    const a = shot.assets[0];
    if (!a.base64) {
      setErr(kk.features.halalErrBase64);
      return;
    }
    setLoading(true);
    try {
      const sec = getRaqatAiSecret().trim();
      const bearer = (await getValidAccessToken())?.trim() ?? "";
      if (!sec && !bearer) {
        setErr(kk.aiChat.configBody);
        return;
      }
      const res = await fetchPlatformAiAnalyzeImage(
        base,
        {
          image_b64: a.base64,
          mime_type: a.mimeType ?? "image/jpeg",
          lang: "kk",
          prompt: buildHalalImagePrompt(),
        },
        {
          aiSecret: sec || undefined,
          authorizationBearer: sec ? undefined : bearer || undefined,
          timeoutMs: 90_000,
        }
      );
      if (!res.ok || res.status === 401 || res.status === 403) {
        setErr(formatAiApiError(res.status, res));
        return;
      }
      if (res.text) setResult(res.text.trim());
      else setErr(res.error ?? kk.aiChat.error);
    } finally {
      setLoading(false);
    }
  }, [base, configured]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{kk.features.halalTitle}</Text>
        <Text style={styles.body}>{kk.features.halalBody}</Text>

        {localhostBase ? (
          <View style={styles.configBlock}>
            <Text style={styles.configBodyMuted}>{kk.features.halalLocalhostHint}</Text>
          </View>
        ) : null}

        {!configured ? (
          <View style={styles.configBlock}>
            <Text style={styles.configTitle}>{kk.aiChat.configTitle}</Text>
            <Text style={styles.configBodyMuted}>{kk.aiChat.configBody}</Text>
            <Pressable
              style={({ pressed }) => [styles.configNavBtn, pressed && { opacity: 0.9 }]}
              onPress={openSettingsTab}
              accessibilityRole="button"
              accessibilityLabel={kk.aiChat.openSettingsTab}
            >
              <Text style={styles.configNavBtnTxt}>{kk.aiChat.openSettingsTab}</Text>
            </Pressable>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder={kk.features.halalPlaceholder}
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          multiline
          editable={!loading}
          textAlignVertical="top"
          underlineColorAndroid="transparent"
        />

        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [
              styles.btnPrimary,
              (!configured || loading || !text.trim()) && styles.btnDisabled,
              pressed && configured && text.trim() && !loading && { opacity: 0.92 },
            ]}
            onPress={() => void runText()}
            disabled={!configured || loading || !text.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryTxt}>{kk.features.halalSubmit}</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.btnSecondary,
            (!configured || loading) && styles.btnDisabled,
            pressed && configured && !loading && { opacity: 0.92 },
          ]}
          onPress={() => void pickImage()}
          disabled={!configured || loading}
        >
          <Text style={styles.btnSecondaryTxt}>{kk.features.halalPickImage}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.btnSecondary,
            (!configured || loading) && styles.btnDisabled,
            pressed && configured && !loading && { opacity: 0.92 },
          ]}
          onPress={() => void captureImage()}
          disabled={!configured || loading}
        >
          <Text style={styles.btnSecondaryTxt}>{kk.features.halalCameraCapture}</Text>
        </Pressable>

        {loading && !result ? (
          <Text style={styles.thinking}>{kk.features.halalThinking}</Text>
        ) : null}

        {err ? <Text style={styles.err}>{err}</Text> : null}

        {result ? (
          <View style={styles.outBox}>
            <Text style={styles.outTitle}>{kk.features.halalResultTitle}</Text>
            <Text style={styles.outBody}>{result}</Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>{kk.aiChat.disclaimer}</Text>
        <Text style={styles.disclaimerSecondary}>{kk.aiChat.usageTips}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    content: { padding: 20 },
    title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 12 },
    body: { fontSize: 15, lineHeight: 22, color: colors.muted, marginBottom: 14 },
    warn: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
      marginBottom: 12,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    configBlock: { marginBottom: 14 },
    configTitle: { color: colors.error, fontWeight: "800", fontSize: 15, marginBottom: 8 },
    configBodyMuted: { color: colors.muted, fontSize: 13, lineHeight: 21, marginBottom: 10 },
    configNavBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    configNavBtnTxt: { color: "#ffffff", fontWeight: "800", fontSize: 15 },
    input: {
      minHeight: 100,
      textAlignVertical: "top",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      fontSize: 15,
      color: colors.text,
      marginBottom: 12,
    },
    row: { marginBottom: 10 },
    btnPrimary: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    btnPrimaryTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
    btnSecondary: {
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 8,
    },
    btnSecondaryTxt: { color: colors.accent, fontWeight: "600", fontSize: 15 },
    btnDisabled: { opacity: 0.45 },
    thinking: { color: colors.muted, marginBottom: 8 },
    err: { color: "#b91c1c", marginBottom: 8, lineHeight: 20 },
    outBox: {
      marginTop: 8,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    outTitle: { color: colors.accent, fontWeight: "800", marginBottom: 8, fontSize: 15 },
    outBody: { color: colors.text, fontSize: 15, lineHeight: 24 },
    disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 16 },
    disclaimerSecondary: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 10,
    },
  });
}
