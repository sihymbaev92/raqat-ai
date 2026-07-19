import React, { useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppleSignInButton, GoogleSignInBlock, isGoogleSignInConfigured } from "../AccountLoginModal";
import { SettingsCard } from "./settingsUi";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { useAppLocale } from "../../i18n/runtime";
import { setWindowSecureFlag } from "../../services/windowSecureFlag";
import { isSensitiveAuthBlocked } from "../../security/appSecurityShield";

type Props = {
  colors: ThemeColors;
  platformPid: string | null;
  loginUser: string;
  loginPass: string;
  onLoginUserChange: (v: string) => void;
  onLoginPassChange: (v: string) => void;
  loginBusy: boolean;
  onLoginBusyChange: (v: boolean) => void;
  onAuthSuccess: () => void;
  onOAuthError: (m: string) => void;
  onLoginMessage: (m: string | null) => void;
  onOAuthMessage: (m: string | null) => void;
  onPasswordLogin: () => void;
  onLogout: () => void;
  oauthMsg: string | null;
  loginMsg: string | null;
};

/** Баптаулар: Google / Apple (және dev логин). SMS телефон кіру жоқ. */
export function SettingsAccountLoginSection({
  colors,
  platformPid,
  loginUser,
  loginPass,
  onLoginUserChange,
  onLoginPassChange,
  loginBusy,
  onAuthSuccess,
  onLoginMessage,
  onOAuthMessage,
  onPasswordLogin,
  onLogout,
  oauthMsg,
  loginMsg,
}: Props) {
  useAppLocale();
  const styles = makeStyles(colors);
  const showGoogle = isGoogleSignInConfigured();
  const showApple = Platform.OS === "ios";
  const showPasswordLogin = __DEV__;
  const securityBlocked = isSensitiveAuthBlocked();

  useEffect(() => {
    void setWindowSecureFlag(true);
    return () => {
      void setWindowSecureFlag(false);
    };
  }, []);

  const clearMessages = () => {
    onOAuthMessage(null);
    onLoginMessage(null);
  };

  const handleOAuthSuccess = () => {
    clearMessages();
    onAuthSuccess();
  };

  const handleOAuthError = (m: string) => {
    onLoginMessage(null);
    onOAuthMessage(m || null);
  };

  return (
    <SettingsCard colors={colors} panel style={styles.panel}>
      {securityBlocked ? (
        <View style={styles.loggedInRow}>
          <MaterialIcons name="security" size={18} color={colors.accent} />
          <Text style={styles.compactHint}>{kk.settings.accountSecurityBlocked}</Text>
        </View>
      ) : null}

      {platformPid && !securityBlocked ? (
        <View style={styles.loggedInRow}>
          <MaterialIcons name="verified-user" size={18} color={colors.accent} />
          <Text style={styles.loggedInTxt} numberOfLines={1}>
            {kk.settings.accountLoggedInAs(platformPid)}
          </Text>
          <Pressable
            onPress={onLogout}
            disabled={loginBusy}
            style={({ pressed }) => [styles.logoutChip, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.settings.accountLogout}
          >
            <Text style={styles.logoutChipTxt}>{kk.settings.accountLogout}</Text>
          </Pressable>
        </View>
      ) : null}

      {!securityBlocked ? (
      <>
      <Text style={styles.compactHint}>
        {showGoogle || showApple
          ? kk.settings.accountLoginCompactHint
          : kk.settings.accountAuthUnavailableHint}
      </Text>

      {showGoogle || showApple ? (
        <View style={styles.oauthRow}>
          {showGoogle ? (
            <View style={styles.oauthCell}>
              <GoogleSignInBlock
                busy={loginBusy}
                compact
                onError={handleOAuthError}
                onSuccess={handleOAuthSuccess}
              />
            </View>
          ) : null}
          {showApple ? (
            <View style={styles.oauthCell}>
              <AppleSignInButton
                busy={loginBusy}
                compact
                onError={handleOAuthError}
                onSuccess={handleOAuthSuccess}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {showPasswordLogin ? (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>{kk.settings.accountPasswordShort}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={kk.settings.accountUsername}
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              value={loginUser}
              onChangeText={onLoginUserChange}
              editable={!loginBusy}
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder={kk.settings.accountPassword}
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={loginPass}
              onChangeText={onLoginPassChange}
              editable={!loginBusy}
            />
          </View>

          {!platformPid ? (
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.88 },
                (loginBusy || !loginUser.trim() || !loginPass) && { opacity: 0.55 },
              ]}
              onPress={onPasswordLogin}
              disabled={loginBusy || !loginUser.trim() || !loginPass}
              accessibilityRole="button"
              accessibilityLabel={kk.settings.accountLogin}
            >
              {loginBusy ? (
                <RaqatOrnamentSpinner size={24} />
              ) : (
                <Text style={styles.primaryBtnTxt}>{kk.settings.accountLogin}</Text>
              )}
            </Pressable>
          ) : null}
        </>
      ) : null}

      {oauthMsg ? <Text style={styles.warn}>{oauthMsg}</Text> : null}
      {loginMsg ? <Text style={styles.ok}>{loginMsg}</Text> : null}
      </>
      ) : null}
    </SettingsCard>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    panel: { gap: 10 },
    loggedInRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingBottom: 4,
    },
    loggedInTxt: {
      flex: 1,
      minWidth: 0,
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
    },
    logoutChip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    logoutChipTxt: { color: colors.text, fontSize: 12, fontWeight: "800" },
    compactHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
    },
    oauthRow: {
      flexDirection: "row",
      gap: 8,
    },
    oauthCell: { flex: 1, minWidth: 0 },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginVertical: 2,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    dividerTxt: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
    },
    passwordRow: {
      flexDirection: "row",
      gap: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 11 : 9,
      color: colors.text,
      fontSize: 15,
      backgroundColor: colors.bg,
    },
    inputHalf: { flex: 1, minWidth: 0 },
    primaryBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
    warn: { color: colors.error, fontSize: 13, lineHeight: 18 },
    ok: { color: colors.accent, fontSize: 13, lineHeight: 18 },
  });
}
