import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
  type ListRenderItem,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useKeyboardOffset } from "../hooks/useKeyboardOffset";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { FATUA_KZ_LABEL_KK, kk, MUFTYAT_KZ_LABEL_KK } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import { getRaqatApiBase, hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";
import { RaqatAiHubHeader } from "../components/RaqatAiHubHeader";
import { RaqatAiExampleChips } from "../components/RaqatAiExampleChips";
import { RaqatKbShelf } from "../components/RaqatKbShelf";
import { RaqatKbStatusBar } from "../components/RaqatKbStatusBar";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { isRaqatAiKbOnlyClient } from "../config/raqatAiKbOnly";
import type { PlatformIslamicKbArticle } from "../services/platformApiClient";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import {
  fetchPlatformAiChat,
  fetchPlatformQuranSearch,
  type AiChatSource,
  type PlatformQuranSearchItem,
} from "../services/platformApiClient";
import { formatAiApiError } from "../utils/formatAiApiError";
import {
  isAiUserFacingErrorText,
  isHollowAiServerReply,
  normalizeAiServerReplyText,
} from "../utils/explainEmptyAiResponse";
import { getValidAccessToken } from "../storage/authTokens";
import type { MoreStackParamList } from "../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  AI_CHAT_QURAN_SEARCH_MS,
  AI_CHAT_QUICK_ROUND1_MS,
  AI_CHAT_QUICK_ROUND2_MS,
  AI_CHAT_STAGED_FULL_MS,
  AI_HTTP_RETRY_MAX_DEFAULT,
  resolveAiTimeoutMs,
} from "../config/aiRequestPolicy";

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
  /** Ескі сақталған чаттар үшін: көрсетіледі, жаңа хабарларда бос */
  detailText?: string;
  /** Толық фаза сәтсіз — тек қысқа жауап қалды */
  detailLoadError?: boolean;
  retryPrompt?: string;
  /** Құран/хадис/99 есім үзінділері — толық жауаппен қайта құру үшін */
  refsBlock?: string;
  /** Fatua.kz / Muftyat.kz дереккөздері (сервер RAG) */
  sources?: AiChatSource[];
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
function buildPromptWithHistory(prev: ChatMsg[], nextUserText: string, kbOnly: boolean): string {
  const lines: string[] = kbOnly
    ? [
        "Тарих төменде; соңында жаңа сұрақ.",
        "Жауап тек Fatua.kz / Muftyat.kz индексіндегі үзінділерге сүйен; ойдан аят, хадис немесе жаңа пәтуа қоспа.",
        "Қазақша, қысқа; материал жеткіліксіз болса — ресми сайттарға жүгіну туралы айт.",
      ]
    : [
        "Тарих төменде; соңында жаңа сұрақ.",
        "Жауап қысқа, таза қазақша; Құран/хадис нөмірін қысқаша көрсет; бөлім атаулары мен «% үлес» жазба.",
        "Сұрақты дәл түсініп жауап бер: дәлел мен сұрақты байланыстыру, ойдан факт қоспау, күмәнді жерде сақтық.",
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

function normalizeAiNarrative(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((line) => {
      const l = line.toLowerCase();
      if (/^\[(құран|хадис|99\s*есім|интернет).*(\d{1,3}\s*%)\]$/i.test(line)) return false;
      if (/^(құран|хадис|99\s*есім|интернет).*(\d{1,3}\s*%)\s*[:\-]?\s*$/i.test(line)) return false;
      if (l.includes("жауап саясаты") && l.includes("%")) return false;
      /** Сервер/модельдің «құран/хадис/есім/үзінді табылмады» дайын жолдары */
      if (/табылмады/.test(l)) {
        if (
          /құран/.test(l) ||
          /хадис/.test(l) ||
          /(99|тоқсан\s*тоғыз)\s*есім/.test(l) ||
          /есімдер/.test(l) ||
          /үзінді/.test(l)
        ) {
          return false;
        }
      }
      if (/^#{1,6}\s/.test(line)) return false;
      if (/^={3,}$/.test(line) || /^-{3,}$/.test(line) || /^\*{3,}$/.test(line)) return false;
      if (/^===\s*.+\s*===$/.test(line)) return false;
      return true;
    });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Әр аяттың мәтінін мүмкіндігінше толық сақтау (сөзбе-сөз жақын). */
const QURAN_VERBATIM_MAX = 1_800;

function formatQuranBlock(items: PlatformQuranSearchItem[] | undefined): string {
  if (!items?.length) {
    return "";
  }
  const top = items.map((row) => {
    const ref = `${row.surah ?? "?"}:${row.ayah ?? "?"}`;
    const raw = (row.text_tr || row.text_ar || "").toString().trim();
    const text = raw.length <= QURAN_VERBATIM_MAX ? raw : `${raw.slice(0, QURAN_VERBATIM_MAX).trim()}…`;
    return `${ref} — ${text}`;
  });
  return top.join("\n\n");
}

function formatAsmaBlock(query: string): string {
  if (!ASMA_ROWS.length) {
    return "";
  }
  const q = query.trim().toLowerCase();
  const tokens = q.split(/\s+/).filter((x) => x.length >= 2).slice(0, 5);
  if (tokens.length === 0) {
    return "";
  }
  const matched = ASMA_ROWS.filter((row) => {
    const kk = row.kk.toLowerCase();
    const ar = row.ar.toLowerCase();
    return tokens.some((tk) => kk.includes(tk) || ar.includes(tk));
  }).slice(0, 2);
  if (!matched.length) {
    return "";
  }
  return matched.map((row) => `№${row.n}. ${row.ar} — ${truncateText(row.kk, 120)}`).join("\n");
}

function joinStageBlocks(blocks: Array<string | null | undefined>): string {
  return blocks.map((x) => (x ?? "").trim()).filter(Boolean).join("\n\n");
}

function buildArticleAskPrompt(article: PlatformIslamicKbArticle): string {
  const title = (article.title || article.source_label || kk.aiChat.kbShelfUntitled).trim();
  const excerpt = (article.excerpt || "").trim();
  const url = (article.url || "").trim();
  return [
    kk.aiChat.kbShelfAskDefault,
    "",
    `${kk.aiChat.kbShelfSourceLabel}: ${article.source_label || article.site}`,
    `${kk.aiChat.kbShelfTopicLabel}: ${title}`,
    url ? `URL: ${url}` : "",
    excerpt ? `${kk.aiChat.kbShelfExcerptLabel}: ${excerpt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildGroundedAiPrompt(
  userQuestion: string,
  historyPrompt: string,
  stage: { quran: string; asma: string }
): string {
  const refs = [stage.quran, stage.asma].map((x) => x.trim()).filter(Boolean);
  if (!refs.length) return historyPrompt;
  const mergedRefs = refs.join("\n\n");
  const grounded = [
    "Тірек:",
    mergedRefs,
    "",
    "Сұрақ:",
    userQuestion.trim(),
    "",
    "Тарих:",
    historyPrompt,
  ].join("\n");
  if (grounded.length <= MAX_PROMPT_CHARS) return grounded;
  return grounded.slice(-MAX_PROMPT_CHARS);
}

function mergeRefsAndBody(refs: string, body: string): string {
  return joinStageBlocks([refs, body]).trim() || body.trim() || refs.trim();
}

/** Көмекші жауабында бөлімдер арасын визуалды ашу: қосарланған жол + ## тақырыптары. */
function splitAssistantAnswerParagraphs(raw: string): string[] {
  const t = (raw ?? "").replace(/\r\n/g, "\n");
  const norm = t.replace(/\n(?=##\s)/g, "\n\n");
  const parts = norm
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length) return parts;
  const one = t.trim();
  return one ? [one] : [];
}

const MAX_SOURCE_CHIPS = 4;

function sourceChipLabel(src: AiChatSource): string {
  const title = (src.title || "").trim();
  if (title) return title.length > 48 ? `${title.slice(0, 47)}…` : title;
  if (src.site === "fatua") return FATUA_KZ_LABEL_KK;
  if (src.site === "muftyat") return MUFTYAT_KZ_LABEL_KK;
  return (src.site || kk.aiChat.sourceFallbackLabel).trim();
}

function AiSourcesCompact({
  sources,
  colors,
  messageId,
}: {
  sources: AiChatSource[];
  colors: ThemeColors;
  messageId: string;
}) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: {
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          gap: 6,
          alignSelf: "stretch",
        },
        title: {
          fontSize: 10,
          fontWeight: "800",
          color: colors.muted,
          textTransform: "uppercase",
          letterSpacing: 0.35,
        },
        linkRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          paddingVertical: 4,
        },
        linkTxt: {
          flex: 1,
          fontSize: 13,
          lineHeight: 18,
          fontWeight: "600",
          color: colors.accent,
        },
        more: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.muted,
          paddingTop: 2,
        },
      }),
    [colors]
  );
  const visible = sources.slice(0, MAX_SOURCE_CHIPS);
  const extra = sources.length - visible.length;

  return (
    <View style={styles.block}>
      <Text style={styles.title}>{kk.aiChat.sourcesTitle}</Text>
      {visible.map((src, si) => {
        const label = sourceChipLabel(src);
        const url = (src.url || "").trim();
        const row = (
          <>
            <MaterialIcons name="link" size={18} color={colors.accent} style={{ marginTop: 1 }} />
            <Text style={styles.linkTxt} numberOfLines={2}>
              {label}
            </Text>
          </>
        );
        return url ? (
          <Pressable
            key={`${messageId}_src_${si}`}
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.88 }]}
            onPress={() => void Linking.openURL(url)}
            accessibilityRole="link"
            accessibilityLabel={kk.aiChat.sourceOpenA11y(label)}
          >
            {row}
          </Pressable>
        ) : (
          <View key={`${messageId}_src_${si}`} style={styles.linkRow}>
            {row}
          </View>
        );
      })}
      {extra > 0 ? <Text style={styles.more}>+{extra} {kk.aiChat.sourcesMore}</Text> : null}
    </View>
  );
}

export function RaqatAIChatScreen() {
  useAppLocale();
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const keyboardOffset = useKeyboardOffset();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const route = useRoute<RouteProp<MoreStackParamList, "ImamAI">>();
  /** Төменгі жүйелік навигация + клавиатура: Android-да жазу жолы клавиатура үстінде қалуы үшін kb қосылады. */
  const inputBottomPad =
    10 +
    Math.max(insets.bottom, Platform.OS === "android" ? 24 : 0) +
    (Platform.OS === "android" ? keyboardOffset : 0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  /** getRaqatApiBase() сақтаудың ескірмеуі үшін: hydrate соңында өсіреміз. */
  const [apiBaseTick, setApiBaseTick] = useState(0);
  const base = useMemo(() => {
    void apiBaseTick;
    return getRaqatApiBase();
  }, [apiBaseTick]);
  const kbOnlyClient = isRaqatAiKbOnlyClient();
  const handledAutoSendPromptRef = useRef<string>("");
  const listRef = useRef<FlatList<ChatMsg>>(null);
  const messagesRef = useRef<ChatMsg[]>([]);
  messagesRef.current = messages;

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

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await hydrateRaqatApiBaseOverride();
        setApiBaseTick((n) => n + 1);
      })();
    }, [])
  );

  /** Chat UI әрқашан ашық: сервер болмаса локал fallback жауап береміз. */
  const canChat = true;

  const send = useCallback(async (overrideText?: string) => {
    const t = (overrideText ?? input).trim();
    if (!t || loading || !canChat) return;
    await hydrateRaqatApiBaseOverride();
    setApiBaseTick((n) => n + 1);
    const base = getRaqatApiBase();
    setInput("");
    const kbOnlyClient = isRaqatAiKbOnlyClient();
    const userMsg: ChatMsg = { id: newId(), role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    const promptForApi = buildPromptWithHistory(messagesRef.current, t, kbOnlyClient);
    const asmaImmediate = kbOnlyClient ? "" : formatAsmaBlock(t);
    if (!base) {
      const local = joinStageBlocks([
        asmaImmediate,
        kk.aiChat.apiMissingDetail,
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
        kbOnly: kbOnlyClient,
        maxRetries: AI_HTTP_RETRY_MAX_DEFAULT,
      });
    };

    const patchAssistant = (patch: Partial<ChatMsg>) => {
      setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, ...patch } : x)));
    };
    const stage: { quran: string; asma: string } = {
      quran: "",
      asma: asmaImmediate,
    };
    setMessages((m) => [
      ...m,
      {
        id: assistantId,
        role: "assistant",
        text: kbOnlyClient ? "" : asmaImmediate,
        refsBlock: kbOnlyClient ? undefined : asmaImmediate,
        detailLoading: true,
      },
    ]);

    if (!kbOnlyClient) {
      const qSearchMs = await resolveAiTimeoutMs(AI_CHAT_QURAN_SEARCH_MS);
      const contentReadSecret = getRaqatContentReadSecret();
      const quranSettled = await Promise.allSettled([
        fetchPlatformQuranSearch(base, t, {
          timeoutMs: qSearchMs,
          limit: 6,
          contentSecret: contentReadSecret,
          authorizationBearer,
        }),
      ]);
      const quranResult = quranSettled[0];
      if (quranResult?.status === "fulfilled") {
        stage.quran = formatQuranBlock(quranResult.value.items);
      }
    }

    let refsBlockStr = kbOnlyClient
      ? ""
      : joinStageBlocks([stage.quran, stage.asma]).trim();
    if (!refsBlockStr && !kbOnlyClient) refsBlockStr = asmaImmediate.trim();
    patchAssistant({ refsBlock: refsBlockStr, text: refsBlockStr });

    const groundedPrompt = kbOnlyClient
      ? promptForApi
      : buildGroundedAiPrompt(t, promptForApi, {
          quran: stage.quran,
          asma: stage.asma,
        });

    /** Кірусіз де LLM сұрауын жібереміз; сервер саясатына қарай жауап береді. */
    let lastQuickText = "";

    try {
      const quickRound1Ms = await resolveAiTimeoutMs(AI_CHAT_QUICK_ROUND1_MS);
      const quickRound2Ms = await resolveAiTimeoutMs(AI_CHAT_QUICK_ROUND2_MS);
      const quickPrimary = await aiChatWithAuthFallback(groundedPrompt, {
        timeoutMs: quickRound1Ms,
        detailLevel: "quick",
      });
      let quickRes = quickPrimary;
      let quickText = normalizeAiServerReplyText(
        typeof quickRes.text === "string" ? normalizeAiNarrative(quickRes.text.trim()) : "",
        quickRes
      );
      let httpOkQuick = quickRes.status === undefined || quickRes.status === 200;

      /** Бірінші quick жауап бос/қате болса — қысқа prompt-пен бір рет қайта көреміз. */
      if (!httpOkQuick || !quickText || quickRes.ok === false) {
        const quickRetry = await aiChatWithAuthFallback(groundedPrompt, {
          timeoutMs: quickRound2Ms,
          detailLevel: "quick",
        });
        quickRes = quickRetry;
        quickText = normalizeAiServerReplyText(
          typeof quickRes.text === "string" ? normalizeAiNarrative(quickRes.text.trim()) : "",
          quickRes
        );
        httpOkQuick = quickRes.status === undefined || quickRes.status === 200;
      }

      if (!httpOkQuick || !quickText || quickRes.ok === false || isHollowAiServerReply(quickText)) {
        patchAssistant({
          text: formatAiApiError(quickRes.status, quickRes),
          refsBlock: undefined,
          detailLoading: false,
          err: true,
          sources: undefined,
        });
        return;
      }

      lastQuickText = quickText;
      const quickSources = Array.isArray(quickRes.sources) ? quickRes.sources : [];
      patchAssistant({
        text: kbOnlyClient ? quickText : mergeRefsAndBody(refsBlockStr, quickText),
        refsBlock: refsBlockStr,
        sources: quickSources.length ? quickSources : undefined,
        detailLoading: kbOnlyClient ? false : true,
        err: false,
      });
      if (kbOnlyClient) return;
    } catch (e) {
      patchAssistant({
        text: formatAiApiError(undefined, {
          detail: e instanceof Error ? e.message : String(e),
        }),
        refsBlock: undefined,
        detailLoading: false,
        err: true,
        sources: undefined,
      });
      return;
    } finally {
      setLoading(false);
    }

    try {
      const fullStageMs = await resolveAiTimeoutMs(AI_CHAT_STAGED_FULL_MS);
      const fullRes = await aiChatWithAuthFallback(groundedPrompt, {
        timeoutMs: fullStageMs,
        detailLevel: "full",
        stagedPipeline: true,
      });
      let fullText = normalizeAiServerReplyText(
        typeof fullRes.text === "string" ? normalizeAiNarrative(fullRes.text.trim()) : "",
        fullRes
      );
      const httpOkFull = fullRes.status === undefined || fullRes.status === 200;
      const fullIsHollow = isHollowAiServerReply(fullText);
      if (httpOkFull && fullText && fullRes.ok !== false && !fullIsHollow) {
        const fullSources = Array.isArray(fullRes.sources) ? fullRes.sources : [];
        patchAssistant({
          text: mergeRefsAndBody(refsBlockStr, fullText),
          refsBlock: refsBlockStr,
          sources: fullSources.length ? fullSources : undefined,
          detailLoading: false,
          detailLoadError: false,
          retryPrompt: undefined,
        });
      } else {
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantId
              ? {
                  ...x,
                  text: mergeRefsAndBody(refsBlockStr, lastQuickText),
                  refsBlock: refsBlockStr,
                  detailLoading: false,
                  detailLoadError: true,
                  retryPrompt: groundedPrompt,
                }
              : x
          )
        );
        void AsyncStorage.setItem(
          LAST_AI_FAIL_KEY,
          JSON.stringify({ at: Date.now(), prompt: groundedPrompt, reason: "full_response_failed" })
        );
      }
    } catch {
      setMessages((m) =>
        m.map((x) =>
          x.id === assistantId
            ? {
                ...x,
                text: mergeRefsAndBody(refsBlockStr, lastQuickText),
                refsBlock: refsBlockStr,
                detailLoading: false,
                detailLoadError: true,
                retryPrompt: promptForApi,
              }
            : x
        )
      );
      void AsyncStorage.setItem(
        LAST_AI_FAIL_KEY,
        JSON.stringify({ at: Date.now(), prompt: groundedPrompt, reason: "network_or_timeout" })
      );
    }
  }, [canChat, input, loading]);

  const onAskAboutArticle = useCallback(
    (article: PlatformIslamicKbArticle) => {
      void send(buildArticleAskPrompt(article));
      listRef.current?.scrollToEnd({ animated: true });
    },
    [send]
  );

  useEffect(() => {
    const p = route.params;
    if (!p?.autoSend || !p.initialPrompt?.trim()) return;
    const token = p.initialPrompt.trim();
    if (handledAutoSendPromptRef.current === token) return;
    handledAutoSendPromptRef.current = token;
    void send(p.initialPrompt.trim());
  }, [route.params, send]);

  const retryDetail = useCallback(
    async (item: ChatMsg) => {
      if (!item.retryPrompt || loading) return;
      await hydrateRaqatApiBaseOverride();
      setApiBaseTick((n) => n + 1);
      const base = getRaqatApiBase();
      if (!base) return;
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
          kbOnly: isRaqatAiKbOnlyClient(),
          maxRetries: AI_HTTP_RETRY_MAX_DEFAULT,
        });
      };
      setMessages((m) =>
        m.map((x) =>
          x.id === item.id ? { ...x, detailLoading: true, detailLoadError: false } : x
        )
      );
      try {
        const fullStageMs = await resolveAiTimeoutMs(AI_CHAT_STAGED_FULL_MS);
        const fullRes = await aiChatWithAuthFallback(item.retryPrompt, {
          timeoutMs: fullStageMs,
          detailLevel: "full",
          stagedPipeline: true,
        });
        const fullText = typeof fullRes.text === "string" ? fullRes.text.trim() : "";
        if (fullRes.ok !== false && (fullRes.status === undefined || fullRes.status === 200) && fullText) {
          const refs = (item.refsBlock ?? "").trim();
          setMessages((m) =>
            m.map((x) =>
              x.id === item.id
                ? {
                    ...x,
                    text: mergeRefsAndBody(refs, normalizeAiNarrative(fullText)),
                    refsBlock: item.refsBlock,
                    detailLoading: false,
                    detailLoadError: false,
                    detailText: undefined,
                  }
                : x
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
    [loading]
  );

  const renderItem: ListRenderItem<ChatMsg> = ({ item }) => {
    const assistantIsError =
      item.role === "assistant" && (item.err || isAiUserFacingErrorText(item.text));
    const showSources =
      item.role === "assistant" &&
      !assistantIsError &&
      item.sources &&
      item.sources.length > 0 &&
      !item.detailLoading;
    const showKbNoSourceWarning =
      kbOnlyClient &&
      item.role === "assistant" &&
      !assistantIsError &&
      !item.detailLoading &&
      Boolean((item.text || "").trim()) &&
      !showSources;

    return (
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
          assistantIsError ? styles.bubbleAssistantErr : null,
        ]}
      >
        {item.role === "assistant" ? (
          <View style={styles.bubbleInner}>
            {splitAssistantAnswerParagraphs(item.text).map((para, i) => (
              <Text
                key={`${item.id}_p_${i}`}
                selectable
                style={[
                  styles.bubbleText,
                  styles.bubbleTextAssistant,
                  assistantIsError ? styles.bubbleTextErr : null,
                  i > 0 ? styles.bubbleAssistantParagraphGap : null,
                ]}
              >
                {para}
              </Text>
            ))}
          </View>
        ) : (
          <Text
            selectable
            style={[
              styles.bubbleText,
              styles.bubbleTextUser,
              item.err ? styles.bubbleTextErr : null,
            ]}
          >
            {item.text}
          </Text>
        )}
        {item.role === "assistant" && item.detailLoading ? (
          <View style={styles.detailLoadingBlock}>
            <View style={styles.detailLoadingRow}>
              <RaqatOrnamentSpinner size={24} />
              <Text style={styles.detailLoadingTxt}>{kk.aiChat.detailPreparingShort}</Text>
            </View>
          </View>
        ) : null}
        {item.role === "assistant" && item.detailText ? (
          <View style={styles.detailLegacyWrap}>
            {splitAssistantAnswerParagraphs(item.detailText).map((para, i) => (
              <Text
                key={`${item.id}_d_${i}`}
                selectable
                style={[
                  styles.bubbleText,
                  styles.bubbleTextAssistant,
                  styles.detailLegacyText,
                  i > 0 ? styles.bubbleAssistantParagraphGap : null,
                ]}
              >
                {para}
              </Text>
            ))}
          </View>
        ) : null}
        {item.role === "assistant" && item.detailLoadError ? (
          <View style={styles.detailFailBox}>
            <Text style={styles.detailMuted}>{kk.aiChat.detailUnavailable}</Text>
            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.9 }]}
              onPress={() => void retryDetail(item)}
            >
              <Text style={styles.retryBtnTxt}>{kk.aiChat.detailRetry}</Text>
            </Pressable>
          </View>
        ) : null}
        {showSources ? (
          <AiSourcesCompact sources={item.sources!} colors={colors} messageId={item.id} />
        ) : null}
        {showKbNoSourceWarning ? (
          <Text style={styles.kbNoSourceWarning}>{kk.aiChat.kbNoSourceWarning}</Text>
        ) : null}
      </View>
    </View>
  );
  };

  const kavOffset = headerHeight + (Platform.OS === "android" ? Math.max(insets.top, 0) : 0);

  return (
    <>
      <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? kavOffset : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListHeaderComponent={
          <>
            <RaqatAiHubHeader colors={colors} isDark={isDark} />
            <RaqatKbStatusBar colors={colors} apiBase={base} refreshKey={apiBaseTick} />
            <Pressable
              style={({ pressed }) => [styles.portalBanner, pressed && { opacity: 0.9 }]}
              onPress={() => navigation.navigate("OfficialKnowledgePortal")}
              accessibilityRole="button"
              accessibilityLabel={kk.knowledgePortal.openPortalBannerA11y}
            >
              <MaterialIcons name="menu-book" size={22} color={colors.accent} />
              <Text style={styles.portalBannerTitle}>{kk.knowledgePortal.openPortalBanner}</Text>
              <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
            <RaqatKbShelf colors={colors} apiBase={base} onAskAboutArticle={onAskAboutArticle} />
          </>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 6 + insets.bottom },
        ]}
        ListEmptyComponent={
          messages.length === 0 && !loading ? (
            <Text style={styles.empty}>{kk.aiChat.empty}</Text>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.thinking}>
              <RaqatOrnamentSpinner size={36} />
              <Text style={styles.thinkingTxt}>{kk.aiChat.thinking}</Text>
            </View>
          ) : null
        }
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
      />

      <RaqatAiExampleChips
        colors={colors}
        disabled={loading}
        onSelect={(q) => {
          setInput(q);
          void send(q);
        }}
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
    </>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
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
    listContent: { paddingHorizontal: 18, paddingTop: 14 },
    portalBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
    },
    portalBannerTitle: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: "800", color: colors.text },
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
      marginBottom: 8,
    },
    bubbleRowUser: { alignItems: "flex-end" },
    bubbleRowAssistant: { alignItems: "flex-start" },
    bubbleWrap: {
      maxWidth: "92%",
      minWidth: 0,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
    },
    bubbleInner: {
      alignSelf: "stretch",
      minWidth: 0,
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
    bubbleAssistantErr: {
      borderColor: `${colors.error}55`,
      backgroundColor: isDark ? "rgba(220,38,38,0.08)" : "rgba(220,38,38,0.06)",
    },
    bubbleText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
      flexShrink: 1,
    },
    /** Көмекші: жол аралығы мен параграфтар арасындағы бос орын */
    bubbleTextAssistant: {
      lineHeight: 26,
    },
    bubbleAssistantParagraphGap: {
      marginTop: 14,
    },
    bubbleTextUser: { color: "#ffffff" },
    bubbleTextErr: { color: colors.error },
    detailLoadingBlock: { marginTop: 8, gap: 4 },
    detailLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    detailLoadingTxt: { color: colors.muted, fontSize: 13 },
    detailLegacyWrap: { marginTop: 8 },
    /** Ескі сақталған хабарлардағы detailText */
    detailLegacyText: { opacity: 0.95 },
    detailMuted: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 8,
    },
    kbNoSourceWarning: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 8,
      fontStyle: "italic",
    },
    detailFailBox: { marginTop: 6, gap: 6 },
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
      alignItems: "center",
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
      minHeight: 48,
      justifyContent: "center",
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnTxt: { color: "#ffffff", fontWeight: "800", fontSize: 15 },
  });
}
