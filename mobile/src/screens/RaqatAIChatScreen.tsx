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
import { getRaqatAiSecret } from "../config/raqatAiSecret";
import { fetchPlatformAiChat } from "../services/platformApiClient";
import { formatAiApiError } from "../utils/formatAiApiError";

const STORAGE_KEY = "raqat_ai_chat_messages_v1";
const MAX_MESSAGES = 80;

export type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  err?: boolean;
};

function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
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
  const secret = getRaqatAiSecret();
  const canChat = Boolean(base && secret);

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
    const userMsg: ChatMsg = { id: newId(), role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await fetchPlatformAiChat(base!, t, {
        aiSecret: secret,
        timeoutMs: 120_000,
      });
      const reply =
        typeof res.text === "string" && res.text.trim() ? res.text.trim() : "";
      const httpOk = res.status === undefined || res.status === 200;
      if (httpOk && reply && res.ok !== false) {
        setMessages((m) => [...m, { id: newId(), role: "assistant", text: reply }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: newId(),
            role: "assistant",
            text: formatAiApiError(res.status, res),
            err: true,
          },
        ]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: newId(),
          role: "assistant",
          text: e instanceof Error ? e.message : kk.aiChat.error,
          err: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [base, canChat, input, loading, secret]);

  const renderItem: ListRenderItem<ChatMsg> = ({ item }) => (
    <View
      style={[
        styles.bubbleWrap,
        item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant,
      ]}
    >
      <Text
        style={[
          styles.bubbleText,
          item.role === "user" ? styles.bubbleTextUser : null,
          item.err ? styles.bubbleTextErr : null,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  const kavOffset = headerHeight + (Platform.OS === "android" ? Math.max(insets.top, 0) : 0);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? kavOffset : 0}
    >
      {!canChat ? (
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
        <TextInput
          style={styles.input}
          placeholder={kk.aiChat.placeholder}
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={8000}
          editable={canChat && !loading}
          onSubmitEditing={() => void send()}
          textAlignVertical="top"
          underlineColorAndroid="transparent"
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (!canChat || loading || !input.trim()) && styles.sendBtnDisabled,
            pressed && canChat && input.trim() && { opacity: 0.88 },
          ]}
          onPress={() => void send()}
          disabled={!canChat || loading || !input.trim()}
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
    bubbleWrap: {
      maxWidth: "92%",
      marginBottom: 10,
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
    },
    bubbleTextUser: { color: "#ffffff" },
    bubbleTextErr: { color: colors.error },
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
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
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
