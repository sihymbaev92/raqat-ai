import React, { useCallback, useEffect, useState } from "react";
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
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CommonActions, useFocusEffect, useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardOffset } from "../hooks/useKeyboardOffset";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getValidAccessToken } from "../storage/authTokens";
import {
  fetchPlatformAiChat,
  fetchPlatformAiAnalyzeImage,
  fetchPlatformHalalCheckText,
} from "../services/platformApiClient";
import { formatAiApiError } from "../utils/formatAiApiError";
import { resolveImagePickerBase64 } from "../utils/resolveImagePickerBase64";
import { buildHalalImagePrompt, buildHalalTextPrompt } from "../content/halalAiPrompts";
import { HalalBarcodeScannerModal } from "../components/HalalBarcodeScannerModal";
import { HalalResultFormatted } from "../components/HalalResultFormatted";
import { fetchProductByBarcodeSmart, formatOpenFoodFactsForHalal } from "../services/openFoodFacts";
import { halalEcodeEntriesSorted } from "../content/halalEcodeDb";
import { runHalalLocalChecks } from "../services/halalLocalChecks";
import {
  loadHalalRecent,
  saveHalalRecentPush,
  type HalalCheckSource,
  type HalalRecentItem,
} from "../storage/halalRecentChecks";

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
  const [serverResult, setServerResult] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  /** Диагностика: API base бар ма, AI auth бар ма */
  const [halalDiag, setHalalDiag] = useState<{ hasBase: boolean; hasAiAuth: boolean }>({
    hasBase: false,
    hasAiAuth: false,
  });
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [copiedFlash, setCopiedFlash] = useState(false);
  const [barcodeModal, setBarcodeModal] = useState(false);
  const [recent, setRecent] = useState<HalalRecentItem[]>([]);
  const [lastSource, setLastSource] = useState<HalalCheckSource | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [lookupStatus, setLookupStatus] = useState("");
  const [localSummary, setLocalSummary] = useState("");

  const offErrText = useCallback((reason?: string, status?: number): string => {
    if (reason === "timeout") return "Open Food Facts: сұрау уақыты бітті (timeout). Қайта көріңіз.";
    if (reason === "network") return "Open Food Facts: желілік қате. Интернет/DNS тексеріңіз.";
    if (reason === "http_429") return "Open Food Facts: шектен көп сұрау (429). Сәлден кейін қайталаңыз.";
    if (reason === "http_404" || reason === "not_found") return kk.features.halalBarcodeNotFound;
    if (reason === "http_5xx") return "Open Food Facts: сервер уақытша қолжетімсіз (5xx).";
    if (status) return `Open Food Facts қате статусы: HTTP ${status}.`;
    return kk.features.halalBarcodeOffError;
  }, []);

  const base = getRaqatApiBase().trim();
  const localhostBase =
    Boolean(base) &&
    (base.includes("127.0.0.1") || base.toLowerCase().includes("localhost"));

  /** Халал AI: Authorization Bearer (кіру JWT, серверде scope «ai»). */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const b = getRaqatApiBase().trim();
        const tok = (await getValidAccessToken())?.trim() ?? "";
        if (!cancelled) {
          setHalalDiag({ hasBase: Boolean(b), hasAiAuth: Boolean(tok) });
        }
        const rec = await loadHalalRecent();
        if (!cancelled) setRecent(rec);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const configured = halalDiag.hasBase;

  useEffect(() => {
    if (!copiedFlash) return;
    const t = setTimeout(() => setCopiedFlash(false), 2000);
    return () => clearTimeout(t);
  }, [copiedFlash]);

  const clearAll = useCallback(() => {
    setText("");
    setResult("");
    setServerResult("");
    setAiResult("");
    setErr("");
    setPreviewUri(null);
    setLastSource(null);
    setLocalSummary("");
  }, []);

  const runLocalPreview = useCallback(() => {
    const check = runHalalLocalChecks(text);
    setLocalSummary(check.summaryKk);
  }, [text]);

  const persistHalalSuccess = useCallback(
    async (source: HalalCheckSource, inputText: string, resultText: string) => {
      await saveHalalRecentPush(source, inputText, resultText);
      setRecent(await loadHalalRecent());
      setLastSource(source);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    },
    []
  );

  const copyResult = useCallback(async () => {
    const joined = [serverResult.trim(), aiResult.trim() ? `AI сараптама:\n${aiResult.trim()}` : ""]
      .filter(Boolean)
      .join("\n\n-----\n\n");
    const payload = joined || result.trim();
    if (!payload) return;
    await Clipboard.setStringAsync(payload);
    setCopiedFlash(true);
  }, [aiResult, result, serverResult]);

  const copyManufacturerTemplate = useCallback(async () => {
    const template = [
      "Сәлеметсіз бе! Өнім құрамы бойынша нақтылағым келеді:",
      "1) E-код/қоспалардың (әсіресе E471, E441, E422 т.б.) қайнар көзі өсімдік пе, әлде жануар ма?",
      "2) Желатин қолданылса, қай жануардан алынған?",
      "3) Спирт/этанол немесе спирт негізді ароматизатор бар ма?",
      "4) Халал сертификаты бар ма? Болса, қай ұйым берген?",
      "Рақмет!",
    ].join("\n");
    await Clipboard.setStringAsync(template);
    setCopiedFlash(true);
  }, []);

  const copyCertificateChecklist = useCallback(async () => {
    const checklist = [
      "Халал сертификат чеклисті:",
      "[] Сертификат ұйымы нақты көрсетілген",
      "[] Сертификат мерзімі (valid until) бар",
      "[] Өнім атауы сертификаттағы атаумен сәйкес",
      "[] Партия/зауыт мәліметі бар",
      "[] Күмәнді E-кодтарға өндірушіден жазбаша жауап алынды",
    ].join("\n");
    await Clipboard.setStringAsync(checklist);
    setCopiedFlash(true);
  }, []);

  const openSettingsTab = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "MoreStack",
        params: { screen: "Settings" },
      })
    );
  }, [navigation]);

  const runText = useCallback(
    async (override?: string) => {
      const t = (override ?? text).trim();
      if (!t || !configured) return;
      setErr("");
      setLookupStatus("");
      setResult("");
      setPreviewUri(null);
      setLoading(true);
      try {
        const bearer = (await getValidAccessToken())?.trim() ?? "";
        const localApi = await fetchPlatformHalalCheckText(base, t, {
          authorizationBearer: bearer || undefined,
          timeoutMs: 30_000,
        });
        const stage1 = localApi.data?.message?.trim() ?? "";
        if (!localApi.success || !stage1) {
          setErr(localApi.error?.message ?? "Halal API жауап бермеді.");
          return;
        }

        let res = await fetchPlatformAiChat(base, buildHalalTextPrompt(t), {
          authorizationBearer: bearer || undefined,
          timeoutMs: 90_000,
        });
        let out = res.text?.trim() ?? "";
        if (!out && res.status !== 401 && res.status !== 403) {
          // Серверде full жауап бос қалса, қысқа режиммен қайта көреміз.
          const quick = await fetchPlatformAiChat(base, buildHalalTextPrompt(t), {
            authorizationBearer: bearer || undefined,
            timeoutMs: 45_000,
            detailLevel: "quick",
          });
          if ((quick.text?.trim() ?? "").length > 0) {
            res = quick;
            out = quick.text?.trim() ?? "";
          }
        }
        const merged = out ? `${stage1}\n\n-----\n🤖 AI сараптама (2-деңгей)\n\n${out}` : stage1;
        setServerResult(stage1);
        setAiResult(out);
        setResult(merged);
        void persistHalalSuccess("text", t, merged);
        if (!out && (res.status === 401 || res.status === 403) && !bearer) {
          setErr("AI бұл сәтте қолжетімсіз (қонақ режимі). Сервер рұқсат етсе автоматты ашылады.");
        } else if (!out && (res.status === 401 || res.status === 403)) {
          setErr(formatAiApiError(res.status, res));
        } else if (!out) {
          setErr(
            "AI жауап бере алмады (сервер бос жауап қайтарды). Интернетті тексеріп, қайта жіберіңіз."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [base, configured, persistHalalSuccess, text]
  );

  const onBarcodeScanned = useCallback(
    async (code: string) => {
      setBarcodeModal(false);
      if (!configured) return;
      setErr("");
      setLookupStatus("");
      setResult("");
      setPreviewUri(null);
      setLoading(true);
      try {
        const bearer = (await getValidAccessToken())?.trim() ?? "";
        let off;
        try {
          off = await fetchProductByBarcodeSmart(code);
        } catch {
          setErr(kk.features.halalBarcodeOffError);
          setLookupStatus("OFF: network-error");
          return;
        }
        if (!off.found) {
          setErr(offErrText(off.reason, off.status));
          setLookupStatus(`OFF: ${off.reason ?? "unknown"}${off.status ? ` (HTTP ${off.status})` : ""}`);
          return;
        }
        setLookupStatus(`OFF: ok (${off.code})`);
        const block = formatOpenFoodFactsForHalal(off);
        setText(block);

        const localApi = await fetchPlatformHalalCheckText(base, block, {
          authorizationBearer: bearer || undefined,
          timeoutMs: 30_000,
        });
        const stage1 = localApi.data?.message?.trim() ?? "";
        if (!localApi.success || !stage1) {
          setErr(localApi.error?.message ?? "Halal API жауап бермеді.");
          return;
        }

        let res = await fetchPlatformAiChat(base, buildHalalTextPrompt(block), {
          authorizationBearer: bearer || undefined,
          timeoutMs: 90_000,
        });
        let out = res.text?.trim() ?? "";
        if (!out && res.status !== 401 && res.status !== 403) {
          const quick = await fetchPlatformAiChat(base, buildHalalTextPrompt(block), {
            authorizationBearer: bearer || undefined,
            timeoutMs: 45_000,
            detailLevel: "quick",
          });
          if ((quick.text?.trim() ?? "").length > 0) {
            res = quick;
            out = quick.text?.trim() ?? "";
          }
        }
        const merged = out ? `${stage1}\n\n-----\n🤖 AI сараптама (2-деңгей)\n\n${out}` : stage1;
        setServerResult(stage1);
        setAiResult(out);
        setResult(merged);
        void persistHalalSuccess("barcode", block, merged);
        if (!out && (res.status === 401 || res.status === 403) && !bearer) {
          setErr("AI бұл сәтте қолжетімсіз (қонақ режимі). Сервер рұқсат етсе автоматты ашылады.");
        } else if (!out && (res.status === 401 || res.status === 403)) {
          setErr(formatAiApiError(res.status, res));
        } else if (!out) {
          setErr(
            "AI жауап бере алмады (сервер бос жауап қайтарды). Интернетті тексеріп, қайта жіберіңіз."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [base, configured, offErrText, persistHalalSuccess]
  );

  const pickImage = useCallback(async () => {
    if (!configured) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErr(kk.features.halalErrGallery);
      return;
    }
    setErr("");
    setResult("");
    setServerResult("");
    setAiResult("");
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      /** Жапсырма: штрих/E-код оқу үшін сапа */
      quality: 0.82,
      base64: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const a = picked.assets[0];
    if (a.uri) setPreviewUri(a.uri);
    const resolved = await resolveImagePickerBase64(a);
    if (!resolved) {
      setErr(kk.features.halalErrBase64);
      return;
    }
    const { base64: b64, mime } = resolved;
    setLoading(true);
    try {
      const bearer = (await getValidAccessToken())?.trim() ?? "";
      const res = await fetchPlatformAiAnalyzeImage(
        base,
        { image_b64: b64, mime_type: mime, lang: "kk", prompt: buildHalalImagePrompt() },
        {
          authorizationBearer: bearer || undefined,
          timeoutMs: 90_000,
        }
      );
      const out = res.text?.trim() ?? "";
      if (out) {
        setServerResult("");
        setAiResult(out);
        setResult(out);
        void persistHalalSuccess("image", kk.features.halalHistoryImageInput, out);
        return;
      }
      if (res.status === 401 || res.status === 403) {
        setErr(
          bearer
            ? formatAiApiError(res.status, res)
            : "AI сурет талдауы қонақ режимінде шектелген болуы мүмкін. Сервер рұқсат етсе жұмыс істейді."
        );
        return;
      }
      setErr(res.error ?? formatAiApiError(res.status, res) ?? kk.aiChat.error);
    } finally {
      setLoading(false);
    }
  }, [base, configured, persistHalalSuccess]);

  const pickImageCrop = useCallback(async () => {
    if (!configured) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErr(kk.features.halalErrGallery);
      return;
    }
    setErr("");
    setResult("");
    setServerResult("");
    setAiResult("");
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      base64: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const a = picked.assets[0];
    if (a.uri) setPreviewUri(a.uri);
    const resolved = await resolveImagePickerBase64(a);
    if (!resolved) {
      setErr(kk.features.halalErrBase64);
      return;
    }
    const { base64: b64, mime } = resolved;
    setLoading(true);
    try {
      const bearer = (await getValidAccessToken())?.trim() ?? "";
      const res = await fetchPlatformAiAnalyzeImage(
        base,
        { image_b64: b64, mime_type: mime, lang: "kk", prompt: buildHalalImagePrompt() },
        {
          authorizationBearer: bearer || undefined,
          timeoutMs: 90_000,
        }
      );
      const out = res.text?.trim() ?? "";
      if (out) {
        setServerResult("");
        setAiResult(out);
        setResult(out);
        void persistHalalSuccess("image", kk.features.halalHistoryImageInput, out);
        return;
      }
      if (res.status === 401 || res.status === 403) {
        setErr(
          bearer
            ? formatAiApiError(res.status, res)
            : "AI сурет талдауы қонақ режимінде шектелген болуы мүмкін. Сервер рұқсат етсе жұмыс істейді."
        );
        return;
      }
      setErr(res.error ?? formatAiApiError(res.status, res) ?? kk.aiChat.error);
    } finally {
      setLoading(false);
    }
  }, [base, configured, persistHalalSuccess]);

  const captureImage = useCallback(async () => {
    if (!configured) return;
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      setErr(kk.features.halalErrCamera);
      return;
    }
    setErr("");
    setResult("");
    setServerResult("");
    setAiResult("");
    const shot = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.82,
      base64: true,
    });
    if (shot.canceled || !shot.assets?.[0]) return;
    const a = shot.assets[0];
    if (a.uri) setPreviewUri(a.uri);
    const camResolved = await resolveImagePickerBase64(a);
    if (!camResolved) {
      setErr(kk.features.halalErrBase64);
      return;
    }
    setLoading(true);
    try {
      const bearer = (await getValidAccessToken())?.trim() ?? "";
      const res = await fetchPlatformAiAnalyzeImage(
        base,
        {
          image_b64: camResolved.base64,
          mime_type: camResolved.mime,
          lang: "kk",
          prompt: buildHalalImagePrompt(),
        },
        {
          authorizationBearer: bearer || undefined,
          timeoutMs: 90_000,
        }
      );
      const out = res.text?.trim() ?? "";
      if (out) {
        setServerResult("");
        setAiResult(out);
        setResult(out);
        void persistHalalSuccess("image", kk.features.halalHistoryImageInput, out);
        return;
      }
      if (res.status === 401 || res.status === 403) {
        setErr(
          bearer
            ? formatAiApiError(res.status, res)
            : "AI сурет талдауы қонақ режимінде шектелген болуы мүмкін. Сервер рұқсат етсе жұмыс істейді."
        );
        return;
      }
      setErr(res.error ?? formatAiApiError(res.status, res) ?? kk.aiChat.error);
    } finally {
      setLoading(false);
    }
  }, [base, configured, persistHalalSuccess]);

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

        {!halalDiag.hasBase ? (
          <View style={styles.configBlock}>
            <Text style={styles.configTitle}>{kk.aiChat.configTitle}</Text>
            <Text style={styles.configBodyMuted}>{kk.features.halalConfigNeedApi}</Text>
            <Pressable
              style={({ pressed }) => [styles.configNavBtn, pressed && { opacity: 0.9 }]}
              onPress={openSettingsTab}
              accessibilityRole="button"
              accessibilityLabel={kk.aiChat.openSettingsTab}
            >
              <Text style={styles.configNavBtnTxt}>{kk.aiChat.openSettingsTab}</Text>
            </Pressable>
          </View>
        ) : !halalDiag.hasAiAuth ? (
          <View style={styles.configBlock}>
            <Text style={styles.configTitle}>AI қосымша режимі</Text>
            <Text style={styles.configBodyMuted}>
              Кірусіз де Halal тексерісі жүреді. AI жауабы сервер рұқсатынa тәуелді: ашық болса қонақ режимінде де
              шығады, шектеу болса кіру қажет.
            </Text>
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

        {recent.length > 0 ? (
          <View style={styles.recentBlock}>
            <Text style={styles.sectionLabel}>{kk.features.halalSectionRecent}</Text>
            <Text style={styles.historyHint}>{kk.features.halalHistoryHint}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentChipsRow}
            >
              {recent.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.recentChip, pressed && { opacity: 0.88 }]}
                  onPress={() => {
                    setErr("");
                    setResult("");
                    setServerResult("");
                    setAiResult("");
                    setLastSource(null);
                    setPreviewUri(null);
                    setText(item.inputText);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.inputPreview}
                >
                  <Text style={styles.recentChipTxt} numberOfLines={2}>
                    {item.inputPreview}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.glossaryBox}>
          <Pressable
            style={({ pressed }) => [styles.glossaryToggle, pressed && { opacity: 0.9 }]}
            onPress={() => setGlossaryOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={kk.features.halalGlossaryTitle}
          >
            <MaterialIcons
              name={glossaryOpen ? "expand-less" : "expand-more"}
              size={22}
              color={colors.accent}
            />
            <Text style={styles.glossaryToggleTxt}>{kk.features.halalGlossaryTitle}</Text>
          </Pressable>
          {glossaryOpen ? (
            <ScrollView
              style={styles.glossaryScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {halalEcodeEntriesSorted().map((row) => (
                <View key={row.code} style={styles.glossaryRow}>
                  <Text style={styles.glossaryCode}>{row.code}</Text>
                  <Text style={styles.glossaryLineTitle}>{row.titleKk}</Text>
                  <Text style={styles.glossaryLineNote}>{row.noteKk}</Text>
                </View>
              ))}
              <Text style={styles.glossaryBody}>{kk.features.halalGlossaryBody}</Text>
            </ScrollView>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>{kk.features.halalSectionImage}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            styles.btnCameraTop,
            (!configured || loading) && styles.btnDisabled,
            pressed && configured && !loading && { opacity: 0.92 },
          ]}
          onPress={() => void captureImage()}
          disabled={!configured || loading}
        >
          <View style={styles.btnCameraTopInner}>
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
            <Text style={styles.btnPrimaryTxt}>{kk.features.halalCameraCapture}</Text>
          </View>
        </Pressable>
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
          onPress={() => void pickImageCrop()}
          disabled={!configured || loading}
        >
          <Text style={styles.btnSecondaryTxt}>{kk.features.halalPickImageCrop}</Text>
        </Pressable>
        <Text style={styles.sectionLabel}>{kk.features.halalSectionBarcode}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.btnSecondary,
            styles.btnRow,
            (!configured || loading) && styles.btnDisabled,
            pressed && configured && !loading && { opacity: 0.92 },
          ]}
          onPress={() => setBarcodeModal(true)}
          disabled={!configured || loading}
        >
          <MaterialIcons name="qr-code-scanner" size={22} color={colors.accent} />
          <Text style={styles.btnSecondaryInline}>{kk.features.halalBarcodeScan}</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>{kk.features.halalSectionText}</Text>
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
              styles.btnSecondary,
              (loading || !text.trim()) && styles.btnDisabled,
              pressed && !loading && text.trim() && { opacity: 0.92 },
            ]}
            onPress={runLocalPreview}
            disabled={loading || !text.trim()}
          >
            <Text style={styles.btnSecondaryTxt}>Жылдам локал талдау (AI-сыз)</Text>
          </Pressable>
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
        {localSummary ? (
          <View style={styles.localBox}>
            <Text style={styles.localTitle}>Алдын-ала тексеру</Text>
            <Text style={styles.localBody}>{localSummary}</Text>
          </View>
        ) : null}

        {previewUri ? (
          <View style={styles.previewBox}>
            <Text style={styles.previewCaption}>{kk.features.halalPreviewLabel}</Text>
            <Image source={{ uri: previewUri }} style={styles.previewImg} resizeMode="contain" />
          </View>
        ) : null}

        {loading && !result ? (
          <Text style={styles.thinking}>{kk.features.halalThinking}</Text>
        ) : null}

        {err ? <Text style={styles.err}>{err}</Text> : null}
        {lookupStatus ? <Text style={styles.lookupStatus}>{lookupStatus}</Text> : null}

        {result ? (
          <View style={styles.outBox}>
            <Text style={styles.outTitle}>{kk.features.halalResultTitle}</Text>
            {lastSource ? (
              <Text style={styles.sourceBadge}>
                {kk.features.halalSourceLabel}{" "}
                {lastSource === "text"
                  ? kk.features.halalSourceText
                  : lastSource === "barcode"
                    ? kk.features.halalSourceBarcode
                    : kk.features.halalSourceImage}
              </Text>
            ) : null}
            {serverResult ? (
              <View style={styles.splitBox}>
                <Text style={styles.splitTitle}>Сервер қорытындысы (1-деңгей)</Text>
                <HalalResultFormatted text={serverResult} colors={colors} />
              </View>
            ) : null}
            {aiResult ? (
              <View style={styles.splitBox}>
                <Text style={styles.splitTitle}>AI қорытындысы (2-деңгей)</Text>
                <HalalResultFormatted text={aiResult} colors={colors} />
              </View>
            ) : !serverResult ? (
              <HalalResultFormatted text={result} colors={colors} />
            ) : null}
            <View style={styles.resultActions}>
              <Pressable
                style={({ pressed }) => [styles.resultBtn, pressed && { opacity: 0.88 }]}
                onPress={() => void copyResult()}
                accessibilityRole="button"
                accessibilityLabel={kk.features.halalCopyResult}
              >
                <MaterialIcons name="content-copy" size={18} color={colors.accent} />
                <Text style={styles.resultBtnTxt}>{kk.features.halalCopyResult}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.resultBtn, pressed && { opacity: 0.88 }]}
                onPress={clearAll}
                accessibilityRole="button"
                accessibilityLabel={kk.features.halalClear}
              >
                <MaterialIcons name="clear-all" size={18} color={colors.muted} />
                <Text style={[styles.resultBtnTxt, { color: colors.muted }]}>{kk.features.halalClear}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.resultBtn, pressed && { opacity: 0.88 }]}
                onPress={() => void copyManufacturerTemplate()}
              >
                <MaterialIcons name="question-answer" size={18} color={colors.accent} />
                <Text style={styles.resultBtnTxt}>Өндірушіге сұрақ үлгісі</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.resultBtn, pressed && { opacity: 0.88 }]}
                onPress={() => void copyCertificateChecklist()}
              >
                <MaterialIcons name="checklist" size={18} color={colors.accent} />
                <Text style={styles.resultBtnTxt}>Сертификат чеклисті</Text>
              </Pressable>
            </View>
            {copiedFlash ? (
              <Text style={styles.copiedHint}>{kk.features.halalCopied}</Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.disclaimer}>{kk.features.halalDisclaimer}</Text>
        <Text style={styles.disclaimerSecondary}>{kk.features.halalUsageTips}</Text>
      </ScrollView>
      <HalalBarcodeScannerModal
        visible={barcodeModal}
        colors={colors}
        onClose={() => setBarcodeModal(false)}
        onBarcode={(c) => void onBarcodeScanned(c)}
      />
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
    sectionLabel: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.accent,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginBottom: 8,
      marginTop: 4,
    },
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
    btnCameraTop: {
      marginBottom: 10,
    },
    btnCameraTopInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
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
    btnRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    btnSecondaryInline: { color: colors.accent, fontWeight: "700", fontSize: 15 },
    btnDisabled: { opacity: 0.45 },
    thinking: { color: colors.muted, marginBottom: 8 },
    err: { color: "#b91c1c", marginBottom: 8, lineHeight: 20 },
    lookupStatus: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
    outBox: {
      marginTop: 8,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    outTitle: { color: colors.accent, fontWeight: "800", marginBottom: 6, fontSize: 15 },
    splitBox: {
      marginTop: 8,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    splitTitle: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.3,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    localBox: {
      marginTop: 8,
      marginBottom: 10,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    localTitle: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 6,
    },
    localBody: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 19,
    },
    sourceBadge: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      marginBottom: 10,
      lineHeight: 18,
    },
    recentBlock: { marginBottom: 8 },
    historyHint: { fontSize: 12, color: colors.muted, marginBottom: 8, lineHeight: 18 },
    recentChipsRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
    recentChip: {
      maxWidth: 220,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    recentChipTxt: { fontSize: 13, fontWeight: "600", color: colors.text, lineHeight: 18 },
    glossaryBox: {
      marginBottom: 14,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    glossaryToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
    glossaryToggleTxt: {
      flex: 1,
      fontSize: 14,
      fontWeight: "800",
      color: colors.accent,
    },
    glossaryScroll: { maxHeight: 320, marginTop: 8 },
    glossaryRow: {
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    glossaryCode: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.accent,
      marginBottom: 4,
    },
    glossaryLineTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
      lineHeight: 20,
    },
    glossaryLineNote: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
    },
    glossaryBody: {
      marginTop: 14,
      fontSize: 13,
      lineHeight: 20,
      color: colors.muted,
    },
    resultActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    resultBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    resultBtnTxt: { fontSize: 14, fontWeight: "700", color: colors.accent },
    copiedHint: { fontSize: 12, color: colors.accent, fontWeight: "700", marginTop: 8 },
    previewBox: {
      marginTop: 4,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    previewCaption: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 4,
    },
    previewImg: { width: "100%", height: 160, backgroundColor: colors.bg },
    disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 16 },
    disclaimerSecondary: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 10,
    },
  });
}
