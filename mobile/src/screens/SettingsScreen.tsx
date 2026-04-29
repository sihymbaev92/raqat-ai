import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../theme/colors";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme, type ThemeMode } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { getRaqatApiBase, saveRaqatApiBaseOverride } from "../config/raqatApiBase";
import { getRaqatDonationUrl } from "../config/raqatDonationUrl";
import { getRaqatSupportAccount } from "../config/raqatSupportAccount";
import { runContentSyncWithIncrementalPatches } from "../services/contentSync";
import { readContentSyncState } from "../services/contentSync";
import {
  fetchPlatformLiveness,
  fetchPlatformReadiness,
  fetchContentStats,
  postAuthLogin,
  type ContentStatsPayload,
  type HealthPayload,
  type ReadinessPayload,
} from "../services/platformApiClient";
import {
  clearLoginTokens,
  getStoredPlatformUserId,
  saveLoginTokens,
  getValidAccessToken,
} from "../storage/authTokens";
import {
  getSelectedCity,
  getNotifEnabled,
  setNotifEnabled,
  getIftarEnabled,
  setIftarEnabled,
} from "../storage/prefs";
import { loadPrayerCache } from "../storage/prayerCache";
import { loadQuranListCache } from "../storage/quranListCache";
import { loadHadithCorpus } from "../storage/hadithCorpus";
import {
  requestNotificationPermissions,
  reschedulePrayerNotifications,
} from "../services/prayerNotifications";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppleSignInButton, GoogleSignInBlock } from "../components/AccountLoginModal";
import { PhoneAuthBlock } from "../components/PhoneAuthBlock";
import { syncHatimWithServerBidirectional } from "../storage/hatimProgress";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

const VOICE_DIAG_KEY = "raqat_voice_diag_v1";
type VoiceDiagEntry = {
  at: number;
  transcript: string;
  action: string;
  lang: "kk-KZ" | "ru-RU";
};

type SettingsMoreLink = keyof Pick<
  MoreStackParamList,
  "TelegramInfo" | "Ecosystem" | "Halal" | "RaqatAI"
>;

type OfflineQualitySnapshot = {
  hadithRows: number;
  quranSurahRows: number;
  quranSavedAt: string | null;
  syncEtag: string | null;
  syncSince: string | null;
  checkedAt: string;
};

export function SettingsScreen() {
  const { colors, mode, setMode } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const insets = useSafeAreaInsets();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [notif, setNotif] = useState(true);
  const [iftar, setIftar] = useState(false);
  const [permHint, setPermHint] = useState(false);
  const [apiBase, setApiBase] = useState(() => getRaqatApiBase());
  const [apiBaseInput, setApiBaseInput] = useState(() => getRaqatApiBase());
  const [apiLoading, setApiLoading] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [readiness, setReadiness] = useState<ReadinessPayload | null>(null);
  const [stats, setStats] = useState<ContentStatsPayload | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncHint, setSyncHint] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMsg, setLoginMsg] = useState<string | null>(null);
  const [oauthMsg, setOauthMsg] = useState<string | null>(null);
  const [platformPid, setPlatformPid] = useState<string | null>(null);
  const [supportAccountCopied, setSupportAccountCopied] = useState(false);
  const [voiceDiag, setVoiceDiag] = useState<VoiceDiagEntry[]>([]);
  const [voiceDiagCopied, setVoiceDiagCopied] = useState(false);
  const [voiceHealthBusy, setVoiceHealthBusy] = useState(false);
  const [voiceHealthReport, setVoiceHealthReport] = useState<string | null>(null);
  const [offlineQualityLoading, setOfflineQualityLoading] = useState(false);
  const [offlineQuality, setOfflineQuality] = useState<OfflineQualitySnapshot | null>(null);

  const load = useCallback(async () => {
    const c = await getSelectedCity();
    setCity(c.city);
    setCountry(c.country);
    setNotif(await getNotifEnabled());
    setIftar(await getIftarEnabled());
  }, []);

  const refreshOfflineQuality = useCallback(async () => {
    setOfflineQualityLoading(true);
    try {
      const [quranList, hadithCorpus, syncState] = await Promise.all([
        loadQuranListCache(),
        loadHadithCorpus(),
        readContentSyncState(),
      ]);
      setOfflineQuality({
        hadithRows: hadithCorpus?.hadiths?.length ?? 0,
        quranSurahRows: quranList?.list?.length ?? 0,
        quranSavedAt: quranList?.savedAt ?? null,
        syncEtag: syncState.etag,
        syncSince: syncState.since,
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setOfflineQualityLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runManualContentSync = useCallback(async () => {
    const base = getRaqatApiBase();
    if (!base) return;
    setSyncLoading(true);
    setSyncHint(null);
    try {
      const bearer = await getValidAccessToken();
      const r = await runContentSyncWithIncrementalPatches(base, {
        timeoutMs: 120_000,
        accessToken: bearer || undefined,
      });
      if (r.unchanged) {
        setSyncHint(kk.settings.contentSyncUnchanged);
      } else if (r.patch) {
        const { quranPatched, hadithStored, errors } = r.patch;
        let msg = kk.settings.contentSyncDone(quranPatched, hadithStored);
        if (errors.length) {
          msg += ` · ${errors.length} ескерту`;
        }
        setSyncHint(msg);
      } else {
        setSyncHint(kk.settings.contentSyncUnchanged);
      }
    } catch {
      setSyncHint(kk.settings.contentSyncError);
    } finally {
      setSyncLoading(false);
    }
  }, []);

  const checkPlatformApi = useCallback(async () => {
    const base = getRaqatApiBase();
    setApiBase(base);
    setApiBaseInput(base);
    if (!base) {
      setApiOk(null);
      setHealth(null);
      setReadiness(null);
      setStats(null);
      setApiLoading(false);
      return;
    }
    setApiLoading(true);
    setApiOk(null);
    try {
      const [hr, sr, rr] = await Promise.allSettled([
        fetchPlatformLiveness(base),
        fetchContentStats(base),
        fetchPlatformReadiness(base),
      ]);
      const h = hr.status === "fulfilled" ? hr.value : null;
      const s = sr.status === "fulfilled" ? sr.value : null;
      const rd = rr.status === "fulfilled" ? rr.value : null;
      setHealth(h);
      setStats(s);
      setReadiness(rd);
      /** Жетімділікті тек /health (немесе /api/v1/info) бойынша — дерекқор 503 /ready-де DB мәселесін «байланыс жоқ» деп көрсетпейді. */
      const healthOk = h != null && h.status === "ok";
      setApiOk(healthOk);
    } catch {
      setHealth(null);
      setReadiness(null);
      setStats(null);
      setApiOk(false);
    } finally {
      setApiLoading(false);
    }
  }, []);

  const applyApiBase = useCallback(async () => {
    const next = await saveRaqatApiBaseOverride(apiBaseInput);
    setApiBase(next);
    await checkPlatformApi();
  }, [apiBaseInput, checkPlatformApi]);

  useFocusEffect(
    useCallback(() => {
      void checkPlatformApi();
      void refreshOfflineQuality();
      void (async () => {
        setPlatformPid(await getStoredPlatformUserId());
        try {
          const rawDiag = await AsyncStorage.getItem(VOICE_DIAG_KEY);
          const parsed = rawDiag ? (JSON.parse(rawDiag) as VoiceDiagEntry[]) : [];
          setVoiceDiag(Array.isArray(parsed) ? parsed.slice(-8).reverse() : []);
        } catch {
          setVoiceDiag([]);
        }
      })();
    }, [checkPlatformApi, refreshOfflineQuality])
  );

  const styles = makeStyles(colors);

  const cycleTheme = () => {
    const order: ThemeMode[] = ["dark", "light", "system"];
    const i = order.indexOf(mode);
    setMode(order[(i + 1) % order.length]);
  };

  const themeLabel =
    mode === "dark"
      ? kk.settings.themeDark
      : mode === "light"
        ? kk.settings.themeLight
        : kk.settings.themeSystem;

  const rescheduleFromCache = async () => {
    const cached = await loadPrayerCache();
    if (!cached || cached.error) return;
    const [en, ift] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
    await reschedulePrayerNotifications(cached, {
      enabled: en,
      iftarExtra: ift,
    });
  };

  const onNotifToggle = async (v: boolean) => {
    if (v) {
      const ok = await requestNotificationPermissions();
      setPermHint(!ok);
      if (!ok) return;
    }
    setNotif(v);
    await setNotifEnabled(v);
    await rescheduleFromCache();
  };

  const openMore = (screen: SettingsMoreLink) => {
    navigation.navigate(screen);
  };

  const scrollPadBottom = 24 + Math.max(insets.bottom, 8);

  const onOAuthSuccess = useCallback(async () => {
    setOauthMsg(null);
    setLoginMsg(kk.settings.accountLoginOk);
    setPlatformPid(await getStoredPlatformUserId());
    await syncHatimWithServerBidirectional();
  }, []);

  const donationUrl = getRaqatDonationUrl();
  const supportAccount = getRaqatSupportAccount();

  const openDonationUrl = useCallback(() => {
    if (!donationUrl) return;
    void Linking.openURL(donationUrl).catch(() => {});
  }, [donationUrl]);

  const copySupportAccount = useCallback(async () => {
    if (!supportAccount) return;
    await Clipboard.setStringAsync(supportAccount);
    setSupportAccountCopied(true);
    setTimeout(() => setSupportAccountCopied(false), 2000);
  }, [supportAccount]);

  const copyVoiceDiag = useCallback(async () => {
    const payload =
      voiceDiag.length === 0
        ? kk.settings.voiceDebugEmpty
        : voiceDiag
            .map((x) => {
              const ts = new Date(x.at).toLocaleString();
              return `[${ts}] (${x.lang}) ${x.action} :: ${x.transcript || "<empty>"}`;
            })
            .join("\n");
    await Clipboard.setStringAsync(payload);
    setVoiceDiagCopied(true);
    setTimeout(() => setVoiceDiagCopied(false), 2000);
  }, [voiceDiag]);

  const runVoiceEngineHealthCheck = useCallback(async () => {
    setVoiceHealthBusy(true);
    try {
      const M = ExpoSpeechRecognitionModule as unknown as {
        getPermissionsAsync?: () => Promise<{ granted?: boolean; status?: string }>;
        requestPermissionsAsync?: () => Promise<{ granted?: boolean; status?: string }>;
        isRecognitionAvailableAsync?: () => Promise<boolean>;
        getSupportedLocalesAsync?: () => Promise<string[]>;
      };
      const lines: string[] = [];
      lines.push(`Platform: ${Platform.OS}`);
      let permLine = "Permission: unknown";
      try {
        const p = (await M.getPermissionsAsync?.()) ?? (await M.requestPermissionsAsync?.());
        if (p) {
          const st = p.status ?? "unknown";
          permLine = `Permission: ${st}${p.granted ? " (granted)" : ""}`;
        }
      } catch (e) {
        permLine = `Permission check error: ${e instanceof Error ? e.message : String(e)}`;
      }
      lines.push(permLine);
      try {
        if (M.isRecognitionAvailableAsync) {
          const ok = await M.isRecognitionAvailableAsync();
          lines.push(`Recognition service: ${ok ? "available" : "unavailable"}`);
        } else {
          lines.push("Recognition service: method not exposed");
        }
      } catch (e) {
        lines.push(`Recognition check error: ${e instanceof Error ? e.message : String(e)}`);
      }
      try {
        if (M.getSupportedLocalesAsync) {
          const locales = await M.getSupportedLocalesAsync();
          const hasKk = locales.includes("kk-KZ");
          const hasRu = locales.includes("ru-RU");
          lines.push(`Locales: kk-KZ=${hasKk ? "yes" : "no"}, ru-RU=${hasRu ? "yes" : "no"}`);
          lines.push(`Locales count: ${locales.length}`);
        } else {
          lines.push("Locales: method not exposed");
        }
      } catch (e) {
        lines.push(`Locales check error: ${e instanceof Error ? e.message : String(e)}`);
      }
      setVoiceHealthReport(lines.join("\n"));
    } finally {
      setVoiceHealthBusy(false);
    }
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: scrollPadBottom }]}
    >
      <Text style={styles.h1}>{kk.settings.title}</Text>

      {apiBase ? (
        <>
          <Text style={[styles.label, styles.accountSectionFirst]}>{kk.settings.accountSection}</Text>
          <Text style={styles.hint}>{kk.settings.accountOAuthHint}</Text>
          <Text style={styles.hint}>{kk.settings.accountHint}</Text>
          {platformPid ? (
            <Text style={styles.boxMuted}>{kk.settings.accountLoggedInAs(platformPid)}</Text>
          ) : null}

          <Text style={[styles.linkMethodTitle, styles.linkMethodTitleFirst]}>
            {kk.settings.accountLinkPhoneTitle}
          </Text>
          <Text style={styles.linkMethodHint}>{kk.settings.accountLinkPhoneSub}</Text>
          <PhoneAuthBlock
            busy={loginBusy}
            setBusy={setLoginBusy}
            onSuccess={() => void onOAuthSuccess()}
            onError={(m) => {
              setOauthMsg(m || null);
              setLoginMsg(null);
            }}
          />

          <Text style={styles.linkMethodTitle}>{kk.settings.accountLinkGmailTitle}</Text>
          <Text style={styles.linkMethodHint}>{kk.settings.accountLinkGmailSub}</Text>
          <GoogleSignInBlock
            busy={loginBusy}
            onError={(m: string) => {
              setOauthMsg(m);
              setLoginMsg(null);
            }}
            onSuccess={() => void onOAuthSuccess()}
          />

          <Text style={styles.linkMethodTitle}>{kk.settings.accountLinkIcloudTitle}</Text>
          <Text style={styles.linkMethodHint}>{kk.settings.accountLinkIcloudSub}</Text>
          <AppleSignInButton
            busy={loginBusy}
            onError={(m: string) => {
              setOauthMsg(m);
              setLoginMsg(null);
            }}
            onSuccess={() => void onOAuthSuccess()}
          />

          <Text style={styles.oauthDivider}>— {kk.settings.accountOrPassword} —</Text>
          <Text style={[styles.label, { marginTop: 4 }]}>{kk.settings.accountUsername}</Text>
          <TextInput
            style={styles.textIn}
            placeholder={kk.settings.accountUsername}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            value={loginUser}
            onChangeText={setLoginUser}
            editable={!loginBusy}
          />
          <Text style={styles.label}>{kk.settings.accountPassword}</Text>
          <TextInput
            style={styles.textIn}
            placeholder={kk.settings.accountPassword}
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={loginPass}
            onChangeText={setLoginPass}
            editable={!loginBusy}
          />
          <View style={styles.rowBetween}>
            <Pressable
              style={({ pressed }) => [
                styles.syncBtn,
                { flex: 1, marginRight: 8 },
                pressed && { opacity: 0.88 },
                loginBusy && { opacity: 0.85 },
              ]}
              onPress={async () => {
                const base = getRaqatApiBase();
                if (!base) return;
                setLoginBusy(true);
                setLoginMsg(null);
                setOauthMsg(null);
                try {
                  const r = await postAuthLogin(base, loginUser, loginPass);
                  if (r.ok && r.access_token && r.refresh_token) {
                    await saveLoginTokens({
                      access_token: r.access_token,
                      refresh_token: r.refresh_token,
                      expires_in: r.expires_in,
                      platform_user_id: r.platform_user_id,
                    });
                    setLoginPass("");
                    setLoginMsg(kk.settings.accountLoginOk);
                    setPlatformPid(await getStoredPlatformUserId());
                    await syncHatimWithServerBidirectional();
                  } else {
                    setLoginMsg(kk.settings.accountLoginFail);
                  }
                } finally {
                  setLoginBusy(false);
                }
              }}
              disabled={loginBusy || !loginUser.trim() || !loginPass}
            >
              {loginBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.syncBtnTxt}>{kk.settings.accountLogin}</Text>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.smallBtn,
                { minWidth: 100, justifyContent: "center" },
                pressed && { opacity: 0.85 },
              ]}
              onPress={async () => {
                await clearLoginTokens();
                setPlatformPid(null);
                setLoginMsg(null);
                setOauthMsg(null);
              }}
            >
              <Text style={styles.smallBtnTxt}>{kk.settings.accountLogout}</Text>
            </Pressable>
          </View>
          {oauthMsg ? <Text style={styles.warn}>{oauthMsg}</Text> : null}
          {loginMsg ? <Text style={styles.syncHint}>{loginMsg}</Text> : null}
        </>
      ) : (
        <Text style={[styles.boxMuted, styles.accountApiMissing]}>{kk.settings.platformApiNotConfigured}</Text>
      )}

      <Text style={styles.label}>{kk.settings.theme}</Text>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
        onPress={cycleTheme}
      >
        <Text style={styles.rowTxt}>{themeLabel}</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>

      <Text style={styles.label}>{kk.settings.cityTitle}</Text>
      <Text style={styles.box}>
        {city}, {country}
      </Text>

      <Text style={styles.label}>{kk.prayer.notifications}</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.rowTxt}>{kk.prayer.enableNotif}</Text>
        <Switch value={notif} onValueChange={onNotifToggle} />
      </View>
      {permHint ? (
        <Text style={styles.warn}>{kk.settings.notifPermission}</Text>
      ) : null}
      <Text style={styles.hint}>{kk.prayer.notifHint}</Text>

      <View style={styles.rowBetween}>
        <Text style={styles.rowTxt}>{kk.prayer.iftarExtra}</Text>
        <Switch
          value={iftar}
          onValueChange={async (v) => {
            setIftar(v);
            await setIftarEnabled(v);
            await rescheduleFromCache();
          }}
        />
      </View>
      <Text style={styles.hint}>{kk.prayer.iftarHint}</Text>

      <Text style={styles.label}>{kk.settings.platformApi}</Text>
      <TextInput
        style={styles.textIn}
        value={apiBaseInput}
        onChangeText={setApiBaseInput}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="http://192.168.0.148:8787"
        placeholderTextColor={colors.muted}
      />
      <Pressable
        style={({ pressed }) => [
          styles.smallBtn,
          { marginLeft: 0, alignSelf: "flex-start", marginTop: 8 },
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => void applyApiBase()}
        disabled={apiLoading}
      >
        <Text style={styles.smallBtnTxt}>API сақтау</Text>
      </Pressable>
      {!apiBase ? (
        <>
          <Text style={styles.boxMuted}>{kk.settings.platformApiNotConfigured}</Text>
          <Text style={styles.hint}>{kk.settings.platformApiHint}</Text>
        </>
      ) : (
        <>
          <Text style={styles.monoBox} selectable>
            {apiBase}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.rowTxt} numberOfLines={2}>
              {apiLoading || apiOk === null
                ? kk.settings.platformApiChecking
                : apiOk
                  ? `${kk.settings.platformApiOk}${health?.version ? ` · ${kk.settings.platformApiVersion(health.version)}` : ""}`
                  : kk.settings.platformApiError}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.smallBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={checkPlatformApi}
              disabled={apiLoading}
            >
              <Text style={styles.smallBtnTxt}>{kk.settings.platformApiRefresh}</Text>
            </Pressable>
          </View>
          {!apiLoading && apiOk === false ? (
            <Text style={styles.hint}>{kk.settings.platformApiErrorHint}</Text>
          ) : null}
          {stats?.ok && stats.tables?.hadith?.rows != null ? (
            <Text style={styles.hint}>
              {kk.settings.platformHadithLine(
                stats.tables.hadith.rows,
                stats.tables.hadith.text_kk_pct ?? 0
              )}
            </Text>
          ) : null}
          {stats?.ok && stats.tables?.quran?.rows != null ? (
            <Text style={styles.hint}>
              {kk.settings.platformQuranLine(
                stats.tables.quran.rows,
                stats.tables.quran.text_kk_pct ?? 0
              )}
            </Text>
          ) : null}
          {readiness?.ok && readiness.backend ? (
            <Text style={styles.hint}>
              {kk.settings.platformReadyHint(readiness.backend)}
            </Text>
          ) : null}
          {readiness &&
          readiness.ok === false &&
          readiness.status !== "unsupported" &&
          readiness.status !== "network" &&
          readiness.status !== "parse_error" ? (
            <Text style={styles.warn}>
              {readiness.error
                ? `${kk.settings.platformReadyFail}: ${readiness.error}`
                : kk.settings.platformReadyFail}
            </Text>
          ) : null}
          {stats && stats.ok === false ? (
            <Text style={styles.warn}>
              {stats.error === "db_not_found"
                ? "Дерекқор табылмады (серверде global_clean.db немесе RAQAT_DB_PATH)."
                : kk.common.error}
            </Text>
          ) : null}

          <Text style={styles.label}>{kk.settings.contentSync}</Text>
          <Text style={styles.hint}>{kk.settings.contentSyncHint}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.syncBtn,
              (pressed || syncLoading) && { opacity: syncLoading ? 1 : 0.88 },
              syncLoading && { opacity: 0.85 },
            ]}
            onPress={runManualContentSync}
            disabled={syncLoading || apiLoading}
            accessibilityRole="button"
            accessibilityLabel={kk.settings.contentSync}
          >
            {syncLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.syncBtnTxt}>{kk.settings.contentSync}</Text>
            )}
          </Pressable>
          {syncHint ? <Text style={styles.syncHint}>{syncHint}</Text> : null}
        </>
      )}

      <Text style={styles.label}>{kk.settings.offlineQualityTitle}</Text>
      <Text style={styles.hint}>{kk.settings.offlineQualityHint}</Text>
      <View style={styles.offlineCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.rowTxt}>{kk.settings.offlineQualityApiStatus}</Text>
          <Text style={apiOk ? styles.okTxt : styles.warnTxt}>
            {apiOk == null ? "—" : apiOk ? kk.settings.offlineQualityApiOk : kk.settings.offlineQualityApiDown}
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.rowTxt}>{kk.settings.offlineQualityHadithRows}</Text>
          <Text style={styles.boxStatTxt}>{offlineQuality?.hadithRows ?? "—"}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.rowTxt}>{kk.settings.offlineQualityQuranRows}</Text>
          <Text style={styles.boxStatTxt}>{offlineQuality?.quranSurahRows ?? "—"}</Text>
        </View>
        <Text style={styles.hint}>
          {kk.settings.offlineQualitySyncState(
            offlineQuality?.syncSince ?? null,
            offlineQuality?.syncEtag ?? null
          )}
        </Text>
        <Text style={styles.hint}>
          {kk.settings.offlineQualitySavedAt(
            offlineQuality?.quranSavedAt ?? null,
            offlineQuality?.checkedAt ?? null
          )}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.85 }]}
          onPress={() => void refreshOfflineQuality()}
          disabled={offlineQualityLoading}
        >
          {offlineQualityLoading ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text style={styles.smallBtnTxt}>{kk.settings.offlineQualityRefresh}</Text>
          )}
        </Pressable>
      </View>

      <Text style={[styles.label, styles.linksSectionLabel]}>{kk.settings.linksSection}</Text>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
        onPress={() => openMore("TelegramInfo")}
        accessibilityRole="button"
        accessibilityLabel={kk.dashboard.telegramShort}
      >
        <View style={styles.rowLead}>
          <MaterialIcons name="telegram" size={22} color={colors.accent} />
          <Text style={styles.rowTxt}>{kk.dashboard.telegramShort}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }, styles.rowGap]}
        onPress={() => openMore("Ecosystem")}
        accessibilityRole="button"
        accessibilityLabel={kk.ecosystem.cardTitle}
      >
        <View style={styles.rowLead}>
          <Text style={styles.rowEmoji}>🌐</Text>
          <Text style={styles.rowTxt}>{kk.ecosystem.cardTitle}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }, styles.rowGap]}
        onPress={() => openMore("Halal")}
        accessibilityRole="button"
        accessibilityLabel={kk.features.halalTitle}
      >
        <View style={styles.rowLead}>
          <Text style={styles.rowEmoji}>✅</Text>
          <Text style={styles.rowTxt}>{kk.features.halalTitle}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }, styles.rowGap]}
        onPress={() => openMore("RaqatAI")}
        accessibilityRole="button"
        accessibilityLabel={kk.features.raqatAiTitle}
      >
        <View style={styles.rowLead}>
          <Text style={styles.rowEmoji}>✨</Text>
          <Text style={styles.rowTxt}>{kk.features.raqatAiTitle}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>

      <View style={styles.supportBlock}>
        <Text style={[styles.supportTitle, { marginBottom: 10 }]}>{kk.settings.voiceDebugTitle}</Text>
        {voiceDiag.length === 0 ? (
          <Text style={styles.supportBody}>{kk.settings.voiceDebugEmpty}</Text>
        ) : (
          <View style={styles.voiceDiagList}>
            {voiceDiag.map((x, idx) => (
              <View key={`${x.at}-${idx}`} style={styles.voiceDiagItem}>
                <Text style={styles.voiceDiagMeta}>
                  {new Date(x.at).toLocaleTimeString()} · {x.lang} · {x.action}
                </Text>
                <Text style={styles.voiceDiagText} numberOfLines={2}>
                  {x.transcript || "<empty>"}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Pressable
          style={({ pressed }) => [styles.supportCopyBtn, pressed && { opacity: 0.9 }]}
          onPress={() => void copyVoiceDiag()}
          accessibilityRole="button"
          accessibilityLabel={kk.settings.voiceDebugCopy}
        >
          <Text style={styles.supportCopyBtnTxt}>
            {voiceDiagCopied ? kk.settings.voiceDebugCopied : kk.settings.voiceDebugCopy}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.supportCopyBtn, pressed && { opacity: 0.9 }]}
          onPress={() => void runVoiceEngineHealthCheck()}
          accessibilityRole="button"
          accessibilityLabel="Voice Engine Health Check"
        >
          <Text style={styles.supportCopyBtnTxt}>
            {voiceHealthBusy ? "Тексерілуде..." : "Engine health check"}
          </Text>
        </Pressable>
        {voiceHealthReport ? (
          <View style={styles.voiceHealthBox}>
            <Text style={styles.voiceHealthText}>{voiceHealthReport}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.supportBlock}>
        <Text style={styles.supportTitle}>{kk.settings.supportProjectTitle}</Text>
        <Text style={styles.supportBody}>{kk.settings.supportProjectBody}</Text>
        {supportAccount ? (
          <>
            <Text style={styles.supportAccountLabel}>{kk.settings.supportAccountLabel}</Text>
            <View style={styles.supportAccountBox}>
              <Text style={styles.supportAccountMono} selectable>
                {supportAccount}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.supportCopyBtn, pressed && { opacity: 0.9 }]}
              onPress={copySupportAccount}
              accessibilityRole="button"
              accessibilityLabel={kk.settings.supportAccountCopy}
            >
              <Text style={styles.supportCopyBtnTxt}>
                {supportAccountCopied
                  ? kk.settings.supportAccountCopied
                  : kk.settings.supportAccountCopy}
              </Text>
            </Pressable>
            <Text style={styles.supportDisclaimer}>{kk.settings.supportAccountDisclaimer}</Text>
          </>
        ) : null}
        {donationUrl ? (
          <Pressable
            style={({ pressed }) => [styles.supportBtn, pressed && { opacity: 0.9 }]}
            onPress={openDonationUrl}
            accessibilityRole="button"
            accessibilityLabel={kk.settings.supportProjectOpen}
          >
            <Text style={styles.supportBtnTxt}>{kk.settings.supportProjectOpen}</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20 },
    h1: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 16 },
    oauthDivider: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 12,
      marginVertical: 14,
    },
    label: { color: colors.muted, fontSize: 12, marginBottom: 8, marginTop: 12 },
    linksSectionLabel: { marginTop: 28 },
    accountSectionFirst: { marginTop: 4 },
    linkMethodTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
      marginTop: 18,
      letterSpacing: 0.15,
    },
    linkMethodTitleFirst: { marginTop: 12 },
    linkMethodHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 4,
      marginBottom: 4,
    },
    accountApiMissing: { marginBottom: 8 },
    rowGap: { marginTop: 8 },
    rowLead: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
    rowEmoji: { fontSize: 20 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    rowTxt: { color: colors.text, fontSize: 16, flex: 1 },
    chev: { color: colors.muted, fontSize: 20 },
    box: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 16,
    },
    hint: { color: colors.muted, fontSize: 13, marginTop: 8, lineHeight: 18 },
    warn: { color: colors.error, fontSize: 13, marginTop: 8 },
    boxMuted: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
    },
    monoBox: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 13,
      fontFamily: "monospace",
    },
    textIn: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.card,
      color: colors.text,
      fontSize: 16,
    },
    smallBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 8,
    },
    smallBtnTxt: { color: colors.accent, fontSize: 14, fontWeight: "600" },
    syncBtn: {
      marginTop: 10,
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    syncBtnTxt: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
    syncHint: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 10,
      lineHeight: 18,
    },
    offlineCard: {
      marginTop: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 6,
    },
    boxStatTxt: { color: colors.text, fontSize: 14, fontWeight: "700" },
    okTxt: { color: colors.success, fontSize: 13, fontWeight: "700" },
    warnTxt: { color: colors.error, fontSize: 13, fontWeight: "700" },
    supportBlock: {
      marginTop: 28,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    supportTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
    },
    supportBody: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },
    supportAccountLabel: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 14,
      marginBottom: 8,
      textAlign: "center",
    },
    supportAccountBox: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    supportAccountMono: {
      color: colors.text,
      fontSize: 13,
      fontFamily: "monospace",
      lineHeight: 20,
    },
    supportCopyBtn: {
      marginTop: 10,
      alignSelf: "center",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    supportCopyBtnTxt: { color: colors.accent, fontSize: 14, fontWeight: "600" },
    supportDisclaimer: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
      marginTop: 10,
    },
    supportBtn: {
      marginTop: 14,
      alignSelf: "center",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: colors.accent,
      minWidth: 200,
      alignItems: "center",
    },
    supportBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
    voiceDiagList: {
      marginTop: 4,
      gap: 8,
    },
    voiceDiagItem: {
      backgroundColor: colors.bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    voiceDiagMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      marginBottom: 2,
    },
    voiceDiagText: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
    },
    voiceHealthBox: {
      marginTop: 10,
      backgroundColor: colors.bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    voiceHealthText: {
      color: colors.text,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: "monospace",
    },
  });
}
