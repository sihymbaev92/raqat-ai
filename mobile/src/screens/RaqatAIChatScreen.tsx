import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  type ListRenderItem,
} from "react-native";
import { useKeyboardOffset } from "../hooks/useKeyboardOffset";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { getRaqatApiBase } from "../config/raqatApiBase";
import {
  fetchPlatformAiChat,
  fetchPlatformHadithSearch,
  fetchPlatformQuranSearch,
  type PlatformHadithSearchItem,
  type PlatformQuranSearchItem,
} from "../services/platformApiClient";
import { getGuestLocalHint } from "../utils/guestAiLocalHints";
import { getValidAccessToken } from "../storage/authTokens";

const STORAGE_KEY = "raqat_ai_chat_messages_v1";
const LAST_AI_FAIL_KEY = "raqat_ai_last_failed_v1";
const MAX_MESSAGES = 80;

export type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  err?: boolean;
  /** Толық жауап күйі (алдымен quick, содан кейін full) */
  detailLoading?: boolean;
  detailText?: string;
  /** Толық фаза сәтсіз — тек қысқа жауап қалды */
  detailLoadError?: boolean;
  retryPrompt?: string;
};

function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const MAX_PROMPT_CHARS = 11_500;
type AsmaRow = { n: number; ar: string; kk: string };

function loadAsmaRows(): AsmaRow[] {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const raw = require("../../assets/bundled/asma-al-husna-kk.json") as AsmaRow[];
    /* eslint-enable @typescript-eslint/no-require-imports */
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
const ASMA_ROWS = loadAsmaRows();

/** Серверге бір сұрау ретінде: соңғы хабарламалар + жаңа сұрақ (көп сатылы контекст). */
function buildPromptWithHistory(prev: ChatMsg[], nextUserText: string): string {
  const lines: string[] = [
    "Төменде сұрақ-жауап тарихы (қысқа), содан кейін жаңа сұрақ.",
    "Жауап саясаты (міндетті): 35% Құран, 35% Хадис, 10% Алланың 99 есімі, 20% интернет/сыртқы дерек.",
    "Пішім: әр бөлімді бөлек бер: [Құран 35%], [Хадис 35%], [99 есім 10%], [Интернет 20%].",
    "Интернет жоқ болса да локал 80% құрылымды сақта, интернет бөліміне жоқ екенін нақты жаз.",
  ];
  const tail = prev.slice(-18);
  for (const m of tail) {
    if (m.err) continue;
    const t = (m.text || "").trim();
    if (!t) continue;
    if (m.role === "user") {
      lines.push(`Пайдаланушы: ${t}`);
    } else {
      const one = t.split(/\n/)[0]?.trim() ?? t;
      lines.push(`Көмекші (қысқа): ${one}`);
    }
  }
  lines.push(`Жаңа сұрақ: ${nextUserText.trim()}`);
  let body = lines.join("\n\n");
  if (body.length > MAX_PROMPT_CHARS) {
    body = body.slice(-MAX_PROMPT_CHARS);
  }
  return body;
}

function truncateText(s: string, max = 180): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function formatQuranBlock(items: PlatformQuranSearchItem[] | undefined): string {
  if (!items?.length) {
    return "📖 Құран 35%: осы сұраққа лайық қысқа аят үзіндісі көрсетілмеді.";
  }
  const top = items.slice(0, 2).map((row) => {
    const ref = `${row.surah ?? "?"}:${row.ayah ?? "?"}`;
    const text = truncateText((row.text_tr || row.text_ar || "").toString(), 170);
    return `- ${ref} — ${text}`;
  });
  return ["📖 Құран 35% — үзінді:", ...top].join("\n");
}

function formatHadithBlock(items: PlatformHadithSearchItem[] | undefined): string {
  if (!items?.length) {
    return "📚 Хадис 35%: осы сұраққа лайық қысқа хадис үзіндісі көрсетілмеді.";
  }
  const top = items.slice(0, 2).map((row) => {
    const src = (row.source || "hadith").toString();
    const text = truncateText((row.text_tr || row.text_ar || "").toString(), 170);
    return `- ${src}: ${text}`;
  });
  return ["📚 Хадис 35% — үзінді:", ...top].join("\n");
}

function formatAsmaBlock(query: string): string {
  if (!ASMA_ROWS.length) {
    return "🕋 99 есім 10%: локал тізім жүктелмеді.";
  }
  const q = query.trim().toLowerCase();
  const tokens = q.split(/\s+/).filter((x) => x.length >= 2).slice(0, 5);
  const fallback = ASMA_ROWS.slice(0, 1);
  const matched =
    tokens.length === 0
      ? fallback
      : ASMA_ROWS.filter((row) => {
          const kk = row.kk.toLowerCase();
          const ar = row.ar.toLowerCase();
          return tokens.some((tk) => kk.includes(tk) || ar.includes(tk));
        }).slice(0, 2);
  const top = (matched.length ? matched : fallback).map(
    (row) => `- №${row.n} ${row.ar} — ${truncateText(row.kk, 120)}`
  );
  return ["🕋 99 есім 10% — Алланың есімдерінен:", ...top].join("\n");
}

function joinStageBlocks(blocks: Array<string | null | undefined>): string {
  return blocks.map((x) => (x ?? "").trim()).filter(Boolean).join("\n\n");
}

function pickPrimaryStageText(stage: { quran: string; hadith: string; asma: string; web: string }): string {
  return [stage.web, stage.hadith, stage.quran, stage.asma].map((x) => x.trim()).find(Boolean) ?? "";
}

export function RaqatAIChatScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const keyboardOffset = useKeyboardOffset();
  const { width: winW } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  /** Төменгі жүйелік навигация + клавиатура: Android-да жазу жолы клавиатура үстінде қалуы үшін kb қосылады. */
  const inputBottomPad =
    10 +
    Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0) +
    (Platform.OS === "android" ? keyboardOffset : 0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const listRef = useRef<FlatList<ChatMsg>>(null);
  const messagesRef = useRef<ChatMsg[]>([]);
  messagesRef.current = messages;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: "center",
      headerTitleContainerStyle: styles.headerTitleContainer,
      headerTitle: () => (
        <View style={[styles.headerTitleRow, { maxWidth: Math.min(winW - 88, 400) }]}>
          <Image
            source={require("../../assets/raqat-ai-header.png")}
            style={styles.headerLogo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerTitleText}>{kk.features.raqatAiTitle}</Text>
          </View>
        </View>
      ),
    });
  }, [navigation, styles, winW]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!alive || !raw) return;
        const j = JSON.parse(raw) as ChatMsg[];
        if (Array.isArray(j) && j.length) {
          setMessages(j.slice(-MAX_MESSAGES));
        }
      } catch {
        /* жаңа сессия */
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_MESSAGES))
    );
  }, [messages, ready]);

  const base = getRaqatApiBase();
  /** Chat UI әрқашан ашық: сервер болмаса локал fallback жауап береміз. */
  const canChat = true;

  const openSettingsTab = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "MoreStack",
        params: { screen: "Settings" },
      })
    );
  }, [navigation]);

  const send = useCallback(async () => {
    const t = input.trim();
    if (!t || loading || !canChat) return;
    setInput("");
    const promptForApi = buildPromptWithHistory(messagesRef.current, t);
    const userMsg: ChatMsg = { id: newId(), role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    const asmaImmediate = formatAsmaBlock(t);
    if (!base) {
      const local = joinStageBlocks([
        asmaImmediate,
        "🌐 API мекенжайы жоқ — Баптауларда база орнатылғанын тексеріңіз (EXPO_PUBLIC_RAQAT_API_BASE).",
      ]);
      setMessages((m) => [
        ...m,
        {
          id: newId(),
          role: "assistant",
          text: local,
          detailLoading: false,
        },
      ]);
      return;
    }
    setLoading(true);
    const assistantId = newId();
    const bearerRaw = ((await getValidAccessToken()) ?? "").trim();
    const isGuest = !bearerRaw;
    const authPrimary = {
      authorizationBearer: bearerRaw || undefined,
    };
    const authorizationBearer = isGuest ? undefined : bearerRaw;

    const aiChatWithAuthFallback = async (
      prompt: string,
      opts: { timeoutMs: number; detailLevel: "quick" | "full"; stagedPipeline?: boolean }
    ) => {
      return fetchPlatformAiChat(base, prompt, {
        ...authPrimary,
        ...opts,
      });
    };

    const setAssistantText = (nextText: string) => {
      setMessages((m) =>
        m.map((x) =>
          x.id === assistantId
            ? { ...x, text: nextText }
            : x
        )
      );
    };
    const stage: { quran: string; hadith: string; asma: string; web: string } = {
      quran: "",
      hadith: "",
      asma: asmaImmediate,
      web: "",
    };
    setMessages((m) => [
      ...m,
      {
        id: assistantId,
        role: "assistant",
        text: asmaImmediate,
        detailLoading: true,
      },
    ]);

    const updateStage = () => {
      setAssistantText(pickPrimaryStageText(stage));
    };

    /** Желі баяу болса да, пайдаланушы бірден мәтін көрсін. */
    updateStage();

    const [quranSettled, hadithSettled] = await Promise.allSettled([
      fetchPlatformQuranSearch(base, t, {
        timeoutMs: 3500,
        limit: 3,
        authorizationBearer,
      }),
      fetchPlatformHadithSearch(base, t, {
        timeoutMs: 4500,
        limit: 4,
        authorizationBearer,
      }),
    ]);

    if (quranSettled.status === "fulfilled") {
      stage.quran = formatQuranBlock(quranSettled.value.items);
    } else {
      stage.quran = "";
    }
    if (hadithSettled.status === "fulfilled") {
      stage.hadith = formatHadithBlock(hadithSettled.value.items);
    } else {
      stage.hadith = "";
    }
    updateStage();

    /** Кірусіз де LLM сұрауын жібереміз; сервер саясатына қарай жауап береді. */

    try {
      const quickPrimary = await aiChatWithAuthFallback(promptForApi, {
        timeoutMs: 25_000,
        detailLevel: "quick",
      });
      let quickRes = quickPrimary;
      let quickText =
        typeof quickRes.text === "string" && quickRes.text.trim()
          ? quickRes.text.trim()
          : "";
      let httpOkQuick = quickRes.status === undefined || quickRes.status === 200;

      /** Бірінші quick жауап бос/қате болса — қысқа prompt-пен бір рет қайта көреміз. */
      if (!httpOkQuick || !quickText || quickRes.ok === false) {
        const quickRetry = await aiChatWithAuthFallback(t, {
          timeoutMs: 15_000,
          detailLevel: "quick",
        });
        quickRes = quickRetry;
        quickText =
          typeof quickRes.text === "string" && quickRes.text.trim()
            ? quickRes.text.trim()
            : "";
        httpOkQuick = quickRes.status === undefined || quickRes.status === 200;
      }

      if (!httpOkQuick || !quickText || quickRes.ok === false) {
        const guestHint = getGuestLocalHint(t);
        const fallbackText = joinStageBlocks([
          guestHint,
          stage.quran,
          stage.hadith,
          stage.asma,
        ]);
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantId
              ? {
                  ...x,
                  text: fallbackText || "Жауап уақытша қолжетімсіз. Кейінірек қайта жіберіңіз.",
                  detailLoading: false,
                }
              : x
          )
        );
        return;
      }

      stage.web = `🌐 Интернет 20%:\n${quickText}`;
      updateStage();
    } catch {
      const guestHint = getGuestLocalHint(t);
      const fallbackText = joinStageBlocks([
        guestHint,
        stage.quran,
        stage.hadith,
        stage.asma,
      ]);
      setMessages((m) =>
        m.map((x) =>
          x.id === assistantId
            ? {
                ...x,
                text: fallbackText || "Жауап уақытша қолжетімсіз. Кейінірек қайта жіберіңіз.",
                detailLoading: false,
              }
            : x
        )
      );
      return;
    } finally {
      setLoading(false);
    }

    try {
      const fullRes = await aiChatWithAuthFallback(promptForApi, {
        timeoutMs: 80_000,
        detailLevel: "full",
        stagedPipeline: true,
      });
      const fullText =
        typeof fullRes.text === "string" && fullRes.text.trim()
          ? fullRes.text.trim()
          : "";
      const httpOkFull = fullRes.status === undefined || fullRes.status === 200;
      if (httpOkFull && fullText && fullRes.ok !== false) {
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantId
              ? { ...x, detailText: fullText, detailLoading: false }
              : x
          )
        );
      } else {
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantId
              ? { ...x, detailLoading: false, detailLoadError: true, retryPrompt: promptForApi }
              : x
          )
        );
        void AsyncStorage.setItem(
          LAST_AI_FAIL_KEY,
          JSON.stringify({ at: Date.now(), prompt: promptForApi, reason: "full_response_failed" })
        );
      }
    } catch {
      setMessages((m) =>
        m.map((x) =>
          x.id === assistantId
            ? { ...x, detailLoading: false, detailLoadError: true, retryPrompt: promptForApi }
            : x
        )
      );
      void AsyncStorage.setItem(
        LAST_AI_FAIL_KEY,
        JSON.stringify({ at: Date.now(), prompt: promptForApi, reason: "network_or_timeout" })
      );
    }
  }, [base, canChat, input, loading]);

  const retryDetail = useCallback(
    async (item: ChatMsg) => {
      if (!base || !item.retryPrompt || loading) return;
      const bearerRaw = ((await getValidAccessToken()) ?? "").trim();
      const authPrimary = {
        authorizationBearer: bearerRaw || undefined,
      };

      const aiChatWithAuthFallback = async (
        prompt: string,
        opts: { timeoutMs: number; detailLevel: "quick" | "full"; stagedPipeline?: boolean }
      ) => {
        return fetchPlatformAiChat(base, prompt, {
          ...authPrimary,
          ...opts,
        });
      };
      setMessages((m) =>
        m.map((x) =>
          x.id === item.id ? { ...x, detailLoading: true, detailLoadError: false } : x
        )
      );
      try {
        const fullRes = await aiChatWithAuthFallback(item.retryPrompt, {
          timeoutMs: 80_000,
          detailLevel: "full",
          stagedPipeline: true,
        });
        const fullText = typeof fullRes.text === "string" ? fullRes.text.trim() : "";
        if (fullRes.ok !== false && (fullRes.status === undefined || fullRes.status === 200) && fullText) {
          setMessages((m) =>
            m.map((x) =>
              x.id === item.id ? { ...x, detailLoading: false, detailText: fullText, detailLoadError: false } : x
            )
          );
          return;
        }
      } catch {
        // handled below
      }
      setMessages((m) =>
        m.map((x) =>
          x.id === item.id ? { ...x, detailLoading: false, detailLoadError: true } : x
        )
      );
    },
    [base, loading]
  );

  const renderItem: ListRenderItem<ChatMsg> = ({ item }) => (
    <View
      style={[
        styles.bubbleRow,
        item.role === "user" ? styles.bubbleRowUser : styles.bubbleRowAssistant,
      ]}
    >
      <View
        style={[
          styles.bubbleWrap,
          item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text
          selectable
          style={[
            styles.bubbleText,
            item.role === "user" ? styles.bubbleTextUser : null,
            item.err ? styles.bubbleTextErr : null,
          ]}
        >
          {item.text}
        </Text>
        {item.role === "assistant" && item.detailLoading ? (
          <View style={styles.detailLoadingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.detailLoadingTxt}>{kk.aiChat.detailPreparing}</Text>
          </View>
        ) : null}
        {item.role === "assistant" && item.detailText ? (
          <>
            <Text style={styles.detailHead}>{kk.aiChat.detailSection}</Text>
            <Text selectable style={styles.bubbleText}>
              {item.detailText}
            </Text>
          </>
        ) : null}
        {item.role === "assistant" && item.detailLoadError ? (
          <View style={styles.detailFailBox}>
            <Text style={styles.detailMuted}>{kk.aiChat.detailUnavailable}</Text>
            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.9 }]}
              onPress={() => void retryDetail(item)}
            >
              <Text style={styles.retryBtnTxt}>Қайта көру</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );

  const kavOffset = headerHeight + (Platform.OS === "android" ? Math.max(insets.top, 0) : 0);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? kavOffset : 0}
    >
      {!base ? (
        <View style={styles.configBox}>
          <Text style={styles.configTitle}>{kk.aiChat.configTitle}</Text>
          <Text style={styles.configBody}>{kk.aiChat.configBody}</Text>
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

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.disclaimer}>{kk.aiChat.disclaimer}</Text>
            <Text style={styles.usageTips}>{kk.aiChat.usageTips}</Text>
          </View>
        }
        ListEmptyComponent={
          messages.length === 0 && !loading ? (
            <Text style={styles.empty}>{kk.aiChat.empty}</Text>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.thinking}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.thinkingTxt}>{kk.aiChat.thinking}</Text>
            </View>
          ) : null
        }
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={[styles.inputRow, { paddingBottom: inputBottomPad }]}>
        {/*
          flex қатарында TextInput кесіліп қалмауы үшін орауышқа minWidth: 0
          (Android: ұзын сұрақтың жартысы көрінбей қалатын мәселе).
        */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder={kk.aiChat.placeholder}
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            multiline
            scrollEnabled
            maxLength={8000}
            editable={!loading}
            onSubmitEditing={() => void send()}
            textAlignVertical="top"
            underlineColorAndroid="transparent"
            {...(Platform.OS === "android" ? { includeFontPadding: false } : {})}
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (loading || !input.trim()) && styles.sendBtnDisabled,
            pressed && input.trim() && { opacity: 0.88 },
          ]}
          onPress={() => void send()}
          disabled={loading || !input.trim()}
        >
          <Text style={styles.sendBtnTxt}>{kk.aiChat.send}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    headerTitleContainer: {
      flexGrow: 1,
      maxWidth: "100%",
    },
    /** Сол: маскот, қалған кеңістікте мәтін ортада */
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      minHeight: 36,
    },
    headerLogo: { height: 32, width: 56, borderRadius: 4, flexShrink: 0 },
    headerTitleCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingRight: 56,
    },
    headerTitleText: {
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 0.6,
      color: colors.text,
    },
    configBox: {
      padding: 14,
      margin: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    configTitle: {
      color: colors.error,
      fontWeight: "700",
      fontSize: 15,
      marginBottom: 8,
    },
    configBody: { color: colors.muted, fontSize: 14, lineHeight: 22 },
    configNavBtn: {
      marginTop: 12,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    configNavBtnTxt: { color: "#ffffff", fontWeight: "800", fontSize: 15 },
    listContent: { padding: 16, paddingBottom: 8 },
    listHeader: { marginBottom: 8 },
    disclaimer: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 8,
    },
    usageTips: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    empty: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
      marginBottom: 12,
    },
    /** Толық экран енін пайдаланып, көпжолды мәтін қиылып қалмасын */
    bubbleRow: {
      width: "100%",
      marginBottom: 10,
    },
    bubbleRowUser: { alignItems: "flex-end" },
    bubbleRowAssistant: { alignItems: "flex-start" },
    bubbleWrap: {
      maxWidth: "92%",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
    },
    bubbleUser: {
      alignSelf: "flex-end",
      backgroundColor: colors.accent,
    },
    bubbleAssistant: {
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      flexShrink: 1,
    },
    bubbleTextUser: { color: "#ffffff" },
    bubbleTextErr: { color: colors.error },
    detailLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },
    detailLoadingTxt: { color: colors.muted, fontSize: 13 },
    detailHead: {
      color: colors.accent,
      fontWeight: "800",
      fontSize: 13,
      marginTop: 10,
      marginBottom: 6,
    },
    detailMuted: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 8,
    },
    detailFailBox: { marginTop: 8, gap: 8 },
    retryBtn: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    retryBtnTxt: { color: colors.accent, fontSize: 12, fontWeight: "700" },
    thinking: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
      marginBottom: 8,
    },
    thinkingTxt: { color: colors.muted, fontSize: 13 },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 12,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
      gap: 8,
    },
    inputWrap: {
      flex: 1,
      minWidth: 0,
    },
    input: {
      width: "100%",
      minHeight: 48,
      maxHeight: 168,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "android" ? 8 : 10,
      color: colors.text,
      fontSize: 16,
      backgroundColor: colors.card,
    },
    sendBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnTxt: { color: "#ffffff", fontWeight: "800", fontSize: 15 },
  });
}
