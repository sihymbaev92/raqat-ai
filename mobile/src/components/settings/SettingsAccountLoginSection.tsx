import React, { useState } from "react";
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
import { PhoneAuthBlock } from "../PhoneAuthBlock";
import { SettingsCard } from "./settingsUi";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";

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

/** Баптаулар: телефон, Google, Apple және логин — бір жинақ карточкада. */
export function SettingsAccountLoginSection({
  colors,
  platformPid,
  loginUser,
  loginPass,
  onLoginUserChange,
  onLoginPassChange,
  loginBusy,
  onLoginBusyChange,
  onAuthSuccess,
  onOAuthError,
  onLoginMessage,
  onOAuthMessage,
  onPasswordLogin,
  onLogout,
  oauthMsg,
  loginMsg,
}: Props) {
  const styles = makeStyles(colors);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const showGoogle = isGoogleSignInConfigured();
  const showApple = Platform.OS === "ios";
  const showPasswordLogin = __DEV__;

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
      {platformPid ? (
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

      <Text style={styles.compactHint}>{kk.settings.accountLoginCompactHint}</Text>

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

      {/*
        Телефон кіру public UI-да қалады; құпиясөз/әкімші жолы dev-only.
        Бұл release-та жартылай бапталған admin форманы көрсетпейді.
      */}
      <Pressable
        onPress={() => setPhoneOpen((o) => !o)}
        style={({ pressed }) => [styles.expandRow, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: phoneOpen }}
        accessibilityLabel={kk.settings.accountPhoneExpand}
      >
        <MaterialIcons name="phone-iphone" size={18} color={colors.accent} />
        <Text style={styles.expandLabel}>{kk.settings.accountPhoneExpand}</Text>
        <MaterialIcons
          name={phoneOpen ? "expand-less" : "expand-more"}
          size={22}
          color={colors.muted}
        />
      </Pressable>
      {phoneOpen ? (
        <PhoneAuthBlock
          compact
          busy={loginBusy}
          setBusy={onLoginBusyChange}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
        />
      ) : null}

      {oauthMsg ? <Text style={styles.warn}>{oauthMsg}</Text> : null}
      {loginMsg ? <Text style={styles.ok}>{loginMsg}</Text> : null}
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
    expandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    expandLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },
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
