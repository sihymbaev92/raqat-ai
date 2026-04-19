import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../theme/colors";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme, type ThemeMode } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getRaqatDonationUrl } from "../config/raqatDonationUrl";
import { getRaqatSupportAccount } from "../config/raqatSupportAccount";
import { getRaqatContentSecret } from "../config/raqatContentSecret";
import { runContentSyncWithIncrementalPatches } from "../services/contentSync";
import {
  fetchPlatformHealth,
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
import {
  requestNotificationPermissions,
  reschedulePrayerNotifications,
} from "../services/prayerNotifications";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppleSignInButton, GoogleSignInBlock } from "../components/AccountLoginModal";
import { syncHatimWithServerBidirectional } from "../storage/hatimProgress";

type SettingsMoreLink = keyof Pick<
  MoreStackParamList,
  "TelegramInfo" | "Ecosystem" | "Halal" | "RaqatAI"
>;

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
  const lastPlatformCheckAt = useRef(0);

  const load = useCallback(async () => {
    const c = await getSelectedCity();
    setCity(c.city);
    setCountry(c.country);
    setNotif(await getNotifEnabled());
    setIftar(await getIftarEnabled());
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
        contentSecret: getRaqatContentSecret() || undefined,
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
        fetchPlatformHealth(base),
        fetchContentStats(base),
        fetchPlatformReadiness(base),
      ]);
      const h = hr.status === "fulfilled" ? hr.value : null;
      const s = sr.status === "fulfilled" ? sr.value : null;
      const rd = rr.status === "fulfilled" ? rr.value : null;
      setHealth(h);
      setStats(s);
      setReadiness(rd);
      const healthOk = h?.status === "ok";
      const dbOk =
        !rd ||
        rd.ok === true ||
        rd.status === "unsupported" ||
        rd.status === "network" ||
        rd.status === "parse_error";
      setApiOk(healthOk && dbOk);
    } catch {
      setHealth(null);
      setReadiness(null);
      setStats(null);
      setApiOk(false);
    } finally {
      setApiLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastPlatformCheckAt.current >= 45_000) {
        lastPlatformCheckAt.current = now;
        checkPlatformApi();
      }
      void (async () => {
        setPlatformPid(await getStoredPlatformUserId());
      })();
    }, [checkPlatformApi])
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

          <GoogleSignInBlock
            busy={loginBusy}
            onError={(m: string) => {
              setOauthMsg(m);
              setLoginMsg(null);
            }}
            onSuccess={() => void onOAuthSuccess()}
          />
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
  });
}
