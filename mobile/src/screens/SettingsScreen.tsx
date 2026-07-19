import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Linking,
  Platform,
  Image
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../theme/colors";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/ThemeContext";
import {
  COLOR_PALETTE_ORDER,
  paletteChipColorsForScheme,
  type ColorPaletteId,
} from "../theme/themePalettes";
import {
  THEME_SCHEME_DARK_ORDER,
  THEME_SCHEME_LIGHT_ORDER,
  themeSchemePreview,
  type ThemeSchemeId,
} from "../theme/themeSchemes";
import { kk } from "../i18n/kk";
import { useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { menuIconAssets } from "../theme/menuIconAssets";
import { getRaqatApiBase, hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";
import { getRaqatDonationUrl } from "../config/raqatDonationUrl";
import { getRaqatSupportAccount } from "../config/raqatSupportAccount";
import { postAuthLogin, probePlatformLiveness, type PlatformLivenessProbe } from "../services/platformApiClient";
import {
  getPrayerNotificationDiagnostics,
  type PrayerNotificationDiagnostics,
} from "../services/prayerNotifications";
import {
  clearLoginTokens,
  getStoredPlatformUserId,
  saveLoginTokens,
  getValidAccessToken,
} from "../storage/authTokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SettingsAccountLoginSection } from "../components/settings/SettingsAccountLoginSection";
import { syncHatimWithServerBidirectional } from "../storage/hatimProgress";
import { syncQuranAyahMarkersWithServerBidirectional } from "../storage/quranAyahMarkers";
import { syncQuranLastReadWithServerBidirectional } from "../storage/quranLastRead";
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsRadioList,
  makeSettingsStyles,
} from "../components/settings/settingsUi";
import { SettingsQiblaSection } from "../components/settings/SettingsQiblaSection";
import { IndependenceBanner } from "../components/IndependenceBanner";
import { PRIVACY_POLICY_URL } from "../content/appTransparency";
import { navigateToMoreStackScreen, navigateToRootStackScreen } from "../navigation/navigateToMoreStack";
import { ScreenFitScrollView } from "../components/ScreenFit";
import { useI18n } from "../i18n/useI18n";
import {
  APP_LOCALE_OPTIONS,
  setCurrentLocale,
  useAppLocale,
  type AppLocale,
} from "../i18n/runtime";
import { getUsageAnalyticsEnabled, setUsageAnalyticsEnabled } from "../storage/prefs";

const COMPACT_COLOR_PALETTES: ColorPaletteId[] = ["default", "sapphire", "violet", "rose"];

type SettingsMoreLink = keyof Pick<
  MoreStackParamList,
  "TelegramInfo" | "Ecosystem" | "Halal"
>;

type ReleaseDiagnostics = {
  api: PlatformLivenessProbe | null;
  prayer: PrayerNotificationDiagnostics | null;
  checkedAt: Date | null;
  error: string | null;
};

function appVersionLine(): string {
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "dev";
  const configBuild =
    Platform.OS === "android" ? Constants.expoConfig?.android?.versionCode : Constants.expoConfig?.ios?.buildNumber;
  const build = Application.nativeBuildVersion ?? configBuild;
  return build != null ? `${version} (${build})` : version;
}

function boolStatus(value: boolean | null | undefined): string {
  if (value === true) return kk.settings.diagnosticsStatusOk;
  if (value === false) return kk.settings.diagnosticsStatusBlock;
  return kk.settings.diagnosticsStatusUnknown;
}

function nativeAzanStatusLabel(status?: PrayerNotificationDiagnostics["nativeAzanReliabilityStatus"]): string {
  switch (status) {
    case "ready":
      return kk.settings.diagnosticsStatusReady;
    case "blocked":
      return kk.settings.diagnosticsStatusBlock;
    case "idle":
      return kk.settings.diagnosticsStatusIdle;
    case "unavailable":
      return kk.settings.diagnosticsStatusUnavailable;
    default:
      return kk.settings.diagnosticsNotChecked;
  }
}

function apiStatusLine(api: PlatformLivenessProbe | null): string {
  if (!api) return kk.settings.diagnosticsNotChecked;
  if (api.ok) {
    const service = api.health.service ? ` · ${api.health.service}` : "";
    const version = api.health.version ? ` · ${api.health.version}` : "";
    return `${kk.settings.diagnosticsStatusOk}${service}${version}`;
  }
  const http = api.httpStatus ? ` HTTP ${api.httpStatus}` : "";
  return `${api.code}${http}`;
}

function checkedAtLine(date: Date | null, locale: string): string {
  if (!date) return kk.settings.diagnosticsCheckedNever;
  const tag =
    locale === "en"
      ? "en-GB"
      : locale === "ru"
        ? "ru-RU"
        : locale === "tr"
          ? "tr-TR"
          : locale === "ar"
            ? "ar"
            : locale === "uz"
              ? "uz-UZ"
              : locale === "ky"
                ? "ky-KG"
                : "kk-KZ";
  return date.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
}

function nativeAzanWarningLine(prayer: PrayerNotificationDiagnostics | null): string | null {
  if (!prayer?.nativeAzanAlarmLastError) return null;
  if (/SCHEDULE_EXACT_ALARM|USE_EXACT_ALARM/i.test(prayer.nativeAzanAlarmLastError)) {
    return kk.settings.diagnosticsExactAlarmWarning;
  }
  return prayer.nativeAzanAlarmLastError;
}

function labelForThemeScheme(id: ThemeSchemeId): string {
  switch (id) {
    case "noir":
      return kk.settings.themeSchemeNoir;
    case "forest":
      return kk.settings.themeSchemeForest;
    case "teal":
      return kk.settings.themeSchemeTeal;
    case "ocean":
      return kk.settings.themeSchemeOcean;
    case "wine":
      return kk.settings.themeSchemeWine;
    case "light":
      return kk.settings.themeSchemeLight;
    case "midnight":
      return kk.settings.themeSchemeMidnight;
    case "meadow":
      return kk.settings.themeSchemeMeadow;
    case "mintDay":
      return kk.settings.themeSchemeMintDay;
    case "sky":
      return kk.settings.themeSchemeSky;
    case "sand":
      return kk.settings.themeSchemeSand;
    case "blush":
      return kk.settings.themeSchemeBlush;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function labelForColorPalette(id: ColorPaletteId): string {
  switch (id) {
    case "default":
      return kk.settings.themePaletteDefault;
    case "sapphire":
      return kk.settings.themePaletteSapphire;
    case "violet":
      return kk.settings.themePaletteViolet;
    case "rose":
      return kk.settings.themePaletteRose;
    case "forest":
      return kk.settings.themePaletteForest;
    case "ember":
      return kk.settings.themePaletteEmber;
    case "gold":
      return kk.settings.themePaletteGold;
    case "indigo":
      return kk.settings.themePaletteIndigo;
    case "mint":
      return kk.settings.themePaletteMint;
    case "lavender":
      return kk.settings.themePaletteLavender;
    case "crimson":
      return kk.settings.themePaletteCrimson;
    case "ocean":
      return kk.settings.themePaletteOcean;
    case "coral":
      return kk.settings.themePaletteCoral;
    case "plum":
      return kk.settings.themePalettePlum;
    case "sand":
      return kk.settings.themePaletteSand;
    case "midnight":
      return kk.settings.themePaletteMidnight;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function SettingsScreen() {
  const { colors, themeScheme, setThemeScheme, colorPalette, setColorPalette, isDark } = useAppTheme();
  const locale = useAppLocale();
  const t = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  useTabHomeBackHeader(navigation, colors);
  const insets = useSafeAreaInsets();
  const [apiBase, setApiBase] = useState(() => getRaqatApiBase());
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMsg, setLoginMsg] = useState<string | null>(null);
  const [oauthMsg, setOauthMsg] = useState<string | null>(null);
  const [platformPid, setPlatformPid] = useState<string | null>(null);
  const [supportAccountCopied, setSupportAccountCopied] = useState(false);
  const [localeBusy, setLocaleBusy] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ReleaseDiagnostics>({
    api: null,
    prayer: null,
    checkedAt: null,
    error: null,
  });
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [usageAnalyticsOn, setUsageAnalyticsOn] = useState(true);
  const supportCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const loadReleaseDiagnostics = useCallback(async () => {
    const base = getRaqatApiBase();
    setDiagnosticsLoading(true);
    try {
      const [api, prayer] = await Promise.all([
        base
          ? probePlatformLiveness(base, 6000)
          : Promise.resolve<PlatformLivenessProbe>({
              ok: false,
              health: null,
              code: "unexpected",
            }),
        getPrayerNotificationDiagnostics(),
      ]);
      if (!mountedRef.current) return;
      setDiagnostics({ api, prayer, checkedAt: new Date(), error: null });
    } catch (e) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : t.settings.diagnosticsLoadFailed;
      setDiagnostics((prev) => ({ ...prev, checkedAt: new Date(), error: msg }));
    } finally {
      if (mountedRef.current) setDiagnosticsLoading(false);
    }
  }, [t.settings.diagnosticsLoadFailed]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        await hydrateRaqatApiBaseOverride();
        if (!alive || !mountedRef.current) return;
        setApiBase(getRaqatApiBase());
        const [pid, analyticsOn] = await Promise.all([
          getStoredPlatformUserId(),
          getUsageAnalyticsEnabled(),
        ]);
        if (!alive || !mountedRef.current) return;
        setPlatformPid(pid);
        setUsageAnalyticsOn(analyticsOn);
        void loadReleaseDiagnostics();
      })();
      return () => {
        alive = false;
      };
    }, [loadReleaseDiagnostics])
  );

  const styles = makeStyles(colors);
  const ui = makeSettingsStyles(colors);

  const openMore = (screen: SettingsMoreLink) => {
    navigateToMoreStackScreen(screen, undefined, navigation);
  };

  const scrollPadBottom = 24 + Math.max(insets.bottom, 8);

  const syncAccountDataAfterLogin = useCallback(async () => {
    await syncHatimWithServerBidirectional();
    await syncQuranLastReadWithServerBidirectional();
    await syncQuranAyahMarkersWithServerBidirectional();
  }, []);

  const onOAuthSuccess = useCallback(async () => {
    setOauthMsg(null);
    setLoginMsg(kk.settings.accountLoginOk);
    const pid = await getStoredPlatformUserId();
    if (!mountedRef.current) return;
    setPlatformPid(pid);
    await syncAccountDataAfterLogin();
  }, [syncAccountDataAfterLogin]);

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
    if (supportCopyTimerRef.current) clearTimeout(supportCopyTimerRef.current);
    supportCopyTimerRef.current = setTimeout(() => {
      supportCopyTimerRef.current = null;
      setSupportAccountCopied(false);
    }, 2000);
  }, [supportAccount]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (supportCopyTimerRef.current) clearTimeout(supportCopyTimerRef.current);
    };
  }, []);

  const languageOptions = APP_LOCALE_OPTIONS.map((opt) => ({
    id: opt.id,
    label: opt.nativeLabel,
  }));

  return (
    <ScreenFitScrollView
      testID="screen-main-profile"
      style={styles.root}
      contentContainerStyle={styles.content}
      bottom={scrollPadBottom}
    >
      {apiBase ? (
        <SettingsSection
          colors={colors}
          title={kk.settings.accountSection}
          subtitle={kk.settings.accountSectionSub}
        >
          <SettingsAccountLoginSection
            colors={colors}
            platformPid={platformPid}
            loginUser={loginUser}
            loginPass={loginPass}
            onLoginUserChange={setLoginUser}
            onLoginPassChange={setLoginPass}
            loginBusy={loginBusy}
            onLoginBusyChange={setLoginBusy}
            onAuthSuccess={() => void onOAuthSuccess()}
            onOAuthError={(m) => {
              setOauthMsg(m || null);
              setLoginMsg(null);
            }}
            onLoginMessage={setLoginMsg}
            onOAuthMessage={setOauthMsg}
            onPasswordLogin={async () => {
              const base = getRaqatApiBase();
              if (!base) return;
              setLoginBusy(true);
              setLoginMsg(null);
              setOauthMsg(null);
              try {
                const r = await postAuthLogin(base, loginUser, loginPass);
                if (r.ok && r.access_token && r.refresh_token) {
                  try {
                    await saveLoginTokens({
                      access_token: r.access_token,
                      refresh_token: r.refresh_token,
                      expires_in: r.expires_in,
                      platform_user_id: r.platform_user_id,
                    });
                  } catch (e) {
                    if (e instanceof Error && e.message === "SECURITY_BLOCKED_DEVICE") {
                      setLoginMsg(kk.settings.accountSecurityBlocked);
                      return;
                    }
                    throw e;
                  }
                  setLoginPass("");
                  setLoginMsg(kk.settings.accountLoginOk);
                  setPlatformPid(await getStoredPlatformUserId());
                  await syncAccountDataAfterLogin();
                } else {
                  setLoginMsg(kk.settings.accountLoginFail);
                }
              } finally {
                setLoginBusy(false);
              }
            }}
            onLogout={async () => {
              await clearLoginTokens();
              setPlatformPid(null);
              setLoginMsg(null);
              setOauthMsg(null);
            }}
            oauthMsg={oauthMsg}
            loginMsg={loginMsg}
          />
        </SettingsSection>
      ) : null}

      <SettingsSection
        colors={colors}
        title={kk.settings.diagnosticsSectionTitle}
        subtitle={kk.settings.diagnosticsSectionSubtitle}
      >
        <SettingsCard colors={colors} panel style={styles.diagnosticsCard}>
          <View style={styles.diagnosticsHeader}>
            <View style={styles.diagnosticsTitleRow}>
              <MaterialIcons name="verified-user" size={22} color={colors.accent} />
              <View style={styles.diagnosticsTitleText}>
                <Text style={styles.diagnosticsTitle}>RAHAT OMIR</Text>
                <Text style={styles.diagnosticsSub}>
                  {kk.settings.diagnosticsLastChecked}: {checkedAtLine(diagnostics.checkedAt, locale)}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.diagnosticsRefresh, pressed && { opacity: 0.86 }]}
              onPress={() => void loadReleaseDiagnostics()}
              disabled={diagnosticsLoading}
              accessibilityRole="button"
              accessibilityLabel={kk.settings.diagnosticsRefreshA11y}
            >
              <Text style={styles.diagnosticsRefreshTxt}>
                {diagnosticsLoading ? kk.settings.diagnosticsRefreshing : kk.settings.diagnosticsRefresh}
              </Text>
            </Pressable>
          </View>
          <View style={styles.diagnosticsGrid}>
            <View style={styles.diagnosticsPill}>
              <Text style={styles.diagnosticsPillLabel}>{kk.settings.diagnosticsVersionLabel}</Text>
              <Text style={styles.diagnosticsPillValue}>{appVersionLine()}</Text>
            </View>
            <View style={styles.diagnosticsPill}>
              <Text style={styles.diagnosticsPillLabel}>{kk.settings.diagnosticsApiLabel}</Text>
              <Text style={styles.diagnosticsPillValue} numberOfLines={2}>
                {apiStatusLine(diagnostics.api)}
              </Text>
            </View>
            <View style={styles.diagnosticsPill}>
              <Text style={styles.diagnosticsPillLabel}>{kk.settings.diagnosticsNotifLabel}</Text>
              <Text style={styles.diagnosticsPillValue}>
                {diagnostics.prayer?.permissionStatus ?? kk.settings.diagnosticsNotChecked}
              </Text>
            </View>
            <View style={styles.diagnosticsPill}>
              <Text style={styles.diagnosticsPillLabel}>{kk.settings.diagnosticsAzanLabel}</Text>
              <Text style={styles.diagnosticsPillValue}>
                {nativeAzanStatusLabel(diagnostics.prayer?.nativeAzanReliabilityStatus)}
              </Text>
            </View>
          </View>
          <View style={styles.diagnosticsDetails}>
            <Text style={styles.diagnosticsDetailText}>
              {kk.settings.diagnosticsDetailSchedule(
                diagnostics.prayer?.scheduledPrayerCount ?? 0,
                diagnostics.prayer?.nativeAzanAlarmCount ?? 0
              )}
            </Text>
            <Text style={styles.diagnosticsDetailText}>
              {kk.settings.diagnosticsDetailPermissions(
                boolStatus(diagnostics.prayer?.nativeAzanExactAlarmPermissionGranted)
              )}
            </Text>
            {nativeAzanWarningLine(diagnostics.prayer) ? (
              <Text style={styles.diagnosticsWarn}>{nativeAzanWarningLine(diagnostics.prayer)}</Text>
            ) : null}
            {diagnostics.error ? <Text style={styles.diagnosticsWarn}>{diagnostics.error}</Text> : null}
            <Text style={styles.diagnosticsBase} numberOfLines={1}>
              {kk.settings.diagnosticsApiBase(apiBase || kk.settings.diagnosticsApiNotSet)}
            </Text>
          </View>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        colors={colors}
        title={kk.settings.languageSection}
        subtitle={kk.settings.languageSectionSub}
      >
        <SettingsRadioList<AppLocale>
          colors={colors}
          options={languageOptions}
          value={locale}
          onChange={(next) => {
            if (localeBusy || next === locale) return;
            setLocaleBusy(true);
            void setCurrentLocale(next).finally(() => setLocaleBusy(false));
          }}
        />
        {localeBusy ? (
          <Text style={[ui.hint, { marginTop: 8 }]}>{kk.common.loading}</Text>
        ) : null}
      </SettingsSection>

      <SettingsSection
        colors={colors}
        title={kk.settings.sectionAppearance}
      >
        <Text style={[ui.rowLabel, styles.appearanceFieldTitle]}>{kk.settings.themeBackgroundTitle}</Text>
        <Text style={[ui.hint, styles.appearanceGroupHint]}>{kk.settings.themeBackgroundCompactHint}</Text>
        <View style={styles.themeSchemeGrid}>
          {THEME_SCHEME_LIGHT_ORDER.map((sid) => {
            const sel = themeScheme === sid;
            const preview = themeSchemePreview(sid);
            const idleBorder = preview.isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.1)";
            return (
              <Pressable
                key={sid}
                style={({ pressed }) => [
                  styles.themeSchemeChip,
                  {
                    backgroundColor: preview.bg,
                    borderColor: sel ? preview.accent : idleBorder,
                    borderWidth: sel ? 2.5 : 1,
                  },
                  pressed && { opacity: 0.92 },
                ]}
                onPress={() => setThemeScheme(sid)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={labelForThemeScheme(sid)}
              >
                <View style={styles.themeSchemeSwatches}>
                  <View
                    style={[
                      styles.themeSchemeSwatch,
                      {
                        backgroundColor: preview.card,
                        borderColor: preview.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)",
                      },
                    ]}
                  />
                  <View style={[styles.themeSchemeSwatch, { backgroundColor: preview.accent }]} />
                </View>
                <Text style={[styles.themeSchemeChipTxt, { color: preview.label }]} numberOfLines={1}>
                  {labelForThemeScheme(sid)}
                </Text>
              </Pressable>
            );
          })}
          {THEME_SCHEME_DARK_ORDER.map((sid) => {
            const sel = themeScheme === sid;
            const preview = themeSchemePreview(sid);
            const idleBorder = preview.isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.1)";
            return (
              <Pressable
                key={sid}
                style={({ pressed }) => [
                  styles.themeSchemeChip,
                  {
                    backgroundColor: preview.bg,
                    borderColor: sel ? preview.accent : idleBorder,
                    borderWidth: sel ? 2.5 : 1,
                  },
                  pressed && { opacity: 0.92 },
                ]}
                onPress={() => setThemeScheme(sid)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={labelForThemeScheme(sid)}
              >
                <View style={styles.themeSchemeSwatches}>
                  <View
                    style={[
                      styles.themeSchemeSwatch,
                      {
                        backgroundColor: preview.card,
                        borderColor: preview.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)",
                      },
                    ]}
                  />
                  <View style={[styles.themeSchemeSwatch, { backgroundColor: preview.accent }]} />
                </View>
                <Text style={[styles.themeSchemeChipTxt, { color: preview.label }]} numberOfLines={1}>
                  {labelForThemeScheme(sid)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[ui.rowLabel, styles.appearanceAccentTitle]}>{kk.settings.colorPaletteTitle}</Text>
        <View style={styles.paletteCompactRow}>
          {COMPACT_COLOR_PALETTES.map((pid) => {
            const sel = colorPalette === pid;
            const chip = paletteChipColorsForScheme(themeScheme, pid);
            return (
              <Pressable
                key={pid}
                style={({ pressed }) => [
                  styles.paletteChip,
                  {
                    backgroundColor: chip.fill,
                    borderColor: sel ? colors.text : chip.rim,
                    borderWidth: sel ? 2.5 : 1,
                  },
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => setColorPalette(pid)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={labelForColorPalette(pid)}
              >
                <Text style={[styles.paletteChipTxt, { color: chip.label }]} numberOfLines={1}>
                  {labelForColorPalette(pid)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SettingsSection>

      <SettingsQiblaSection
        colors={colors}
        onOpenQibla={() => {
          navigateToRootStackScreen("Qibla");
        }}
      />

      <SettingsSection
        colors={colors}
        title={kk.settings.sectionTransparency}
        subtitle={kk.settings.sectionTransparencySub}
      >
        <SettingsCard colors={colors}>
          <Text style={[ui.rowLabel, { marginBottom: 8 }]}>
            {kk.settings.transparencyIndependenceTitle}
          </Text>
          <IndependenceBanner colors={colors} />
          <Pressable
            style={({ pressed }) => [styles.row, styles.rowGap, pressed && { opacity: 0.9 }]}
            onPress={() => {
              void Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
            }}
            accessibilityRole="link"
            accessibilityLabel={kk.settings.transparencyPrivacyOpen}
          >
            <View style={styles.rowLead}>
              <MaterialIcons name="privacy-tip" size={22} color={colors.accent} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowTxt}>{kk.settings.transparencyPrivacyTitle}</Text>
                <Text style={[ui.hint, { marginTop: 2 }]}>{kk.settings.transparencyPrivacyOpen}</Text>
              </View>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <View style={[styles.rowGap, { paddingTop: 4 }]}>
            <Text style={ui.rowLabel}>{kk.settings.transparencyDataFlowsTitle}</Text>
            <Text style={[ui.hint, { marginTop: 6 }]}>{kk.transparency.dataFlowsBody}</Text>
          </View>
          <View style={[styles.rowBetween, styles.rowGap]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={ui.rowLabel}>{kk.settings.transparencyUsageAnalyticsTitle}</Text>
              <Text style={[ui.hint, { marginTop: 4 }]}>
                {kk.settings.transparencyUsageAnalyticsSub}
              </Text>
            </View>
            <Switch
              value={usageAnalyticsOn}
              onValueChange={(on) => {
                setUsageAnalyticsOn(on);
                void setUsageAnalyticsEnabled(on);
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
              accessibilityLabel={kk.settings.transparencyUsageAnalyticsTitle}
            />
          </View>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.sectionLinks} subtitle={kk.settings.sectionLinksSub}>
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
          <Image
            source={menuIconAssets.tileHalal}
            style={[styles.rowMenuIcon, styles.rowMenuIconPromo]}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.rowTxt}>{kk.features.halalTitle}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.sectionSupport}>
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
      </SettingsSection>
</ScreenFitScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 36 },
    label: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 8, marginTop: 4 },
    linksSectionLabel: { marginTop: 28 },
    accountSectionFirst: { marginTop: 4 },
    accountApiMissing: { marginBottom: 8 },
    diagnosticsCard: {
      gap: 12,
    },
    diagnosticsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    diagnosticsTitleRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    diagnosticsTitleText: {
      flex: 1,
      minWidth: 0,
    },
    diagnosticsTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
      letterSpacing: 0.2,
    },
    diagnosticsSub: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 2,
    },
    diagnosticsRefresh: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    diagnosticsRefreshTxt: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
    },
    diagnosticsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    diagnosticsPill: {
      flexGrow: 1,
      flexBasis: "47%",
      minWidth: 130,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    diagnosticsPillLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 4,
    },
    diagnosticsPillValue: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "900",
    },
    diagnosticsDetails: {
      gap: 5,
      paddingTop: 2,
    },
    diagnosticsDetailText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
    },
    diagnosticsWarn: {
      color: colors.error,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
    },
    diagnosticsBase: {
      color: colors.muted,
      opacity: 0.86,
      fontSize: 11,
      marginTop: 2,
    },
    rowGap: { marginTop: 8 },
    rowLead: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
    rowEmoji: { fontSize: 20 },
    rowMenuIcon: { width: 26, height: 26, opacity: 0.84 },
    /** Халал / Имам ИИ — сәл ірі, фонсыз PNG */
    rowMenuIconPromo: { width: 32, height: 32, opacity: 1 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    soundPick: { gap: 6, marginBottom: 10 },
    soundRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingVertical: 4,
      paddingLeft: 6,
      paddingRight: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    soundRowMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 8,
      minHeight: 44,
    },
    soundRowSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    soundPreviewHit: {
      padding: 6,
      marginVertical: 2,
      borderRadius: 10,
    },
    soundPreviewSpacer: { width: 40 },
    soundMark: { width: 22, textAlign: "right", fontSize: 16, color: colors.muted },
    rowTxt: { color: colors.text, fontSize: 16, flex: 1, fontWeight: "700" },
    chev: { color: colors.muted, fontSize: 20 },
    box: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 16,
    },
    hint: { color: colors.muted, fontSize: 13, marginTop: 8, lineHeight: 18 },
    warn: { color: colors.error, fontSize: 13, marginTop: 8, lineHeight: 19 },
    warnBlock: { marginTop: 8, gap: 8 },
    warnLinkBtn: {
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    warnLinkTxt: { color: colors.accent, fontSize: 13, fontWeight: "800" },
    boxMuted: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
    },
    monoBox: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 16,
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
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.card,
      color: colors.text,
      fontSize: 16,
    },
    /** Карточка ішіндегі алғашқы өріс: сыртқы label бар, margin қысқартады. */
    textInInCard: {
      marginTop: 0,
      backgroundColor: "#11151B",
    },
    cardNote: {
      marginTop: 12,
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
    },
    monoInCard: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      fontFamily: "monospace",
      fontSize: 13,
      color: colors.text,
      lineHeight: 20,
    },
    apiCardRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginTop: 10,
      paddingTop: 4,
    },
    apiStatusTxt: {
      flex: 1,
      paddingRight: 10,
      fontSize: 15,
    },
    hintInCard: {
      marginTop: 10,
    },
    warnInCard: {
      marginTop: 10,
    },
    smallBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 8,
    },
    smallBtnTxt: { color: colors.accent, fontSize: 14, fontWeight: "600" },
    offlineCard: {
      marginTop: 8,
      padding: 12,
      borderRadius: 16,
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
      borderRadius: 18,
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
      backgroundColor: "#11151B",
      padding: 12,
      borderRadius: 14,
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
      backgroundColor: "#11151B",
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
    mushafDensityRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
      marginTop: 4,
    },
    appearanceFieldTitle: {
      marginTop: 2,
      marginBottom: 2,
      fontWeight: "800",
    },
    appearanceGroupHint: {
      marginTop: 0,
      marginBottom: 8,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    appearanceAccentTitle: {
      marginTop: 8,
      marginBottom: 8,
      fontWeight: "800",
    },
    themeSchemeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    themeModeChip: {
      width: "31%",
      minWidth: 96,
      flexGrow: 1,
      borderRadius: 14,
      overflow: "hidden",
    },
    themeSchemeChip: {
      width: "48%",
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 14,
      overflow: "hidden",
    },
    themeSchemeSwatches: {
      flexDirection: "row",
      justifyContent: "flex-start",
      gap: 5,
      marginBottom: 5,
    },
    themeSchemeSwatch: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
    },
    themeSchemeChipTxt: {
      fontSize: 10,
      fontWeight: "800",
      textAlign: "left",
      letterSpacing: 0.2,
    },
    themeModeFill: {
      height: 36,
      width: "100%",
    },
    themeModeSplit: {
      flexDirection: "row",
      height: 36,
      width: "100%",
    },
    themeModeSplitHalf: {
      flex: 1,
      height: "100%",
    },
    themeModeLabel: {
      fontSize: 12,
      fontWeight: "800",
      textAlign: "center",
      paddingVertical: 8,
      paddingHorizontal: 6,
      backgroundColor: colors.card,
    },
    paletteCompactRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 4,
    },
    paletteChip: {
      flex: 1,
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 13,
    },
    paletteChipTxt: {
      fontSize: 11,
      fontWeight: "800",
      textAlign: "center",
    },
    mushafDensityChip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    mushafDensityChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    mushafDensityChipTxt: { color: colors.muted, fontSize: 14, fontWeight: "700" },
    mushafDensityChipTxtActive: { color: colors.text },
  });
}
