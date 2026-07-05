import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import {
  enrichHalalCompanyCardsWithMedia,
  fetchHalalDamuCompanyFull,
  halalCompanyDisplayImageUrl,
  halalDamuCompanyWebUrl,
  type HalalDamuCompanyCard,
  type HalalDamuExtraLink,
} from "../../api/halalDamuWp";
import { kk } from "../../i18n/kk";
import type { ThemeColors } from "../../theme/colors";
import { halalCertLabelKk } from "../../utils/halalCertDisplay";
import { labelForHalalInstitutionCategory } from "../../utils/halalCategoryLabels";
import {
  halalCompany2GisUrl,
  halalCompanyTelUrl,
  halalCompanyWhatsAppUrl,
  halalExtraLinkLabel,
} from "../../utils/halalCompanyNavigation";
import { HalalCertBadge } from "../HalalCertBadge";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";

type Props = {
  visible: boolean;
  company: HalalDamuCompanyCard | null;
  colors: ThemeColors;
  isDark: boolean;
  onClose: () => void;
};

export function HalalCompanyDetailSheet({ visible, company, colors, isDark, onClose }: Props) {
  const [detail, setDetail] = useState<HalalDamuCompanyCard | null>(company);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !company) {
      setDetail(null);
      setLoadErr(null);
      return;
    }
    setDetail(company);
    let alive = true;
    setLoading(true);
    setLoadErr(null);
    void (async () => {
      const [{ card: full }, enriched] = await Promise.all([
        fetchHalalDamuCompanyFull(company),
        enrichHalalCompanyCardsWithMedia([company]),
      ]);
      if (!alive) return;
      const withMedia = enriched[0] ?? full;
      setDetail({
        ...full,
        logoUrl: withMedia.logoUrl ?? full.logoUrl,
        thumbnailUrl: withMedia.thumbnailUrl ?? full.thumbnailUrl,
        galleryUrls: withMedia.galleryUrls.length ? withMedia.galleryUrls : full.galleryUrls,
      });
      if (!full.phone && !full.address && !full.phones.length) {
        setLoadErr(kk.features.halalHubNetworkErr);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [visible, company]);

  const logoUrl = useMemo(() => (detail ? halalCompanyDisplayImageUrl(detail) : null), [detail]);
  const route2Gis = useMemo(() => (detail ? halalCompany2GisUrl(detail) : null), [detail]);
  const routeGoogle = useMemo(() => detail?.resolvedMapUrl ?? null, [detail]);
  const phones = useMemo(() => {
    if (!detail) return [];
    const list = detail.phones?.length ? detail.phones : detail.phone ? [detail.phone] : [];
    return list.filter((p) => p.replace(/\D/g, "").length >= 5);
  }, [detail]);
  const whatsappLinks = useMemo(() => {
    if (!detail) return [] as HalalDamuExtraLink[];
    const fromExtra = detail.extraUrls.filter((e) => e.kind === "whatsapp");
    if (fromExtra.length) return fromExtra;
    const waPhone = phones.find((p) => p.replace(/\D/g, "").length >= 10);
    if (!waPhone) return [];
    const url = halalCompanyWhatsAppUrl(waPhone);
    return url ? [{ url, kind: "whatsapp" as const, hint: "phone" }] : [];
  }, [detail, phones]);
  const socialLinks = useMemo(
    () => detail?.extraUrls.filter((e) => e.kind !== "whatsapp") ?? [],
    [detail]
  );
  const websiteUrl = useMemo(() => {
    if (!detail) return null;
    const site = (detail.website ?? "").trim();
    if (site.startsWith("http")) return site;
    return halalDamuCompanyWebUrl(detail);
  }, [detail]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={kk.features.halalHubClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.topRow}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{kk.features.halalHubDetailTitle}</Text>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={kk.common.close}>
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingRow}>
                <RaqatOrnamentSpinner size={28} />
                <Text style={[styles.loadingTxt, { color: colors.muted }]}>{kk.features.halalHubLoading}</Text>
              </View>
            ) : null}
            {loadErr ? (
              <Text style={[styles.loadErr, { color: colors.muted }]}>{loadErr}</Text>
            ) : null}

            <View style={[styles.hero, { backgroundColor: colors.accentSurface }]}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.heroLogo} resizeMode="contain" />
              ) : (
                <MaterialIcons name="storefront" size={56} color={colors.accent} />
              )}
            </View>

            {detail ? (
              <>
                <Text style={[styles.title, { color: colors.text }]}>{detail.title}</Text>
                {detail.legalName && detail.legalName !== detail.title ? (
                  <Text style={[styles.legal, { color: colors.muted }]}>
                    {kk.features.halalHubLegalName}: {detail.legalName}
                  </Text>
                ) : null}
                <View style={styles.badgeRow}>
                  {detail.certificateStatus ? (
                    <HalalCertBadge status={detail.certificateStatus} colors={colors} isDark={isDark} />
                  ) : null}
                  {detail.categoryType ? (
                    <View style={[styles.catChip, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                      <Text style={[styles.catChipTxt, { color: colors.text }]}>
                        {labelForHalalInstitutionCategory(detail.categoryType)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <InfoRow
                  icon="place"
                  label={kk.features.halalHubAddress}
                  value={detail.address?.trim() || "—"}
                  colors={colors}
                  action={
                    detail.address?.trim() ? (
                      <View style={styles.inlineActions}>
                        <Pressable
                          onPress={() => void Clipboard.setStringAsync(detail.address!.trim())}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={kk.features.halalHubCopyAddress}
                        >
                          <Text style={[styles.inlineActionTxt, { color: colors.accent }]}>
                            {kk.features.halalHubCopyAddress}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null
                  }
                />

                <InfoRow
                  icon="phone"
                  label={kk.features.halalHubPhone}
                  colors={colors}
                  value={
                    phones.length ? (
                      phones.map((p, i) => (
                        <Pressable
                          key={`${p}-${i}`}
                          onPress={() => {
                            const url = halalCompanyTelUrl(p);
                            if (url) void Linking.openURL(url);
                          }}
                          accessibilityRole="button"
                        >
                          <Text style={[styles.linkValue, { color: colors.accent }]}>{p}</Text>
                        </Pressable>
                      ))
                    ) : (
                      <Text style={[styles.infoValue, { color: colors.text }]}>—</Text>
                    )
                  }
                />

                {whatsappLinks.length > 0 ? (
                  <InfoRow
                    icon="chat"
                    label={kk.features.halalHubWhatsApp}
                    colors={colors}
                    value={whatsappLinks.map((link, i) => (
                      <Pressable
                        key={`${link.url}-${i}`}
                        onPress={() => void Linking.openURL(link.url)}
                        accessibilityRole="link"
                      >
                        <Text style={[styles.linkValue, { color: colors.accent }]}>
                          {kk.features.halalHubWhatsAppOpen}
                        </Text>
                      </Pressable>
                    ))}
                  />
                ) : null}

                {socialLinks.length > 0 ? (
                  <InfoRow
                    icon="share"
                    label={kk.features.halalHubContactsQuick}
                    colors={colors}
                    value={socialLinks.map((link) => (
                      <Pressable
                        key={link.url}
                        onPress={() => void Linking.openURL(link.url)}
                        accessibilityRole="link"
                      >
                        <Text style={[styles.linkValue, { color: colors.accent }]}>
                          {halalExtraLinkLabel(link.kind)}
                        </Text>
                      </Pressable>
                    ))}
                  />
                ) : null}

                {detail.description?.trim() ? (
                  <InfoRow
                    icon="info-outline"
                    label={kk.features.halalHubDescription}
                    value={detail.description.trim()}
                    colors={colors}
                  />
                ) : null}
                {detail.certNumber ? (
                  <InfoRow
                    icon="verified"
                    label={kk.features.halalHubCertNumber}
                    value={detail.certNumber}
                    colors={colors}
                  />
                ) : null}
                {(detail.certIssuedAt || detail.certExpiresAt) && (
                  <InfoRow
                    icon="event"
                    label={kk.features.halalHubCert}
                    value={[
                      detail.certIssuedAt ? `${kk.features.halalHubCertIssued}: ${detail.certIssuedAt}` : "",
                      detail.certExpiresAt ? `${kk.features.halalHubCertExpires}: ${detail.certExpiresAt}` : "",
                    ]
                      .filter(Boolean)
                      .join("\n")}
                    colors={colors}
                  />
                )}
                {detail.certificateStatus ? (
                  <Text style={[styles.certLine, { color: colors.muted }]}>
                    {halalCertLabelKk(detail.certificateStatus)}
                  </Text>
                ) : null}
                {detail.updatedAt ? (
                  <Text style={[styles.updatedAt, { color: colors.muted }]}>
                    {kk.features.halalHubUpdatedAt}: {detail.updatedAt.slice(0, 10)}
                  </Text>
                ) : null}

                {detail.galleryUrls.length > 0 ? (
                  <View style={styles.galleryBlock}>
                    <Text style={[styles.galleryTitle, { color: colors.text }]}>{kk.features.halalHubGallery}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                      {detail.galleryUrls.map((url) => (
                        <Image key={url} source={{ uri: url }} style={styles.galleryImg} resizeMode="cover" />
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                <View style={styles.actions}>
                  {route2Gis ? (
                    <Pressable
                      onPress={() => void Linking.openURL(route2Gis)}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        { backgroundColor: colors.accent },
                        pressed && { opacity: 0.9 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={kk.features.halalHubOpen2Gis}
                    >
                      <MaterialIcons name="directions" size={20} color="#fff" />
                      <Text style={styles.primaryBtnTxt}>{kk.features.halalHubOpen2Gis}</Text>
                    </Pressable>
                  ) : null}
                  {routeGoogle ? (
                    <Pressable
                      onPress={() => void Linking.openURL(routeGoogle)}
                      style={({ pressed }) => [
                        styles.secondaryBtn,
                        { borderColor: colors.border, backgroundColor: colors.bg },
                        pressed && { opacity: 0.9 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={kk.features.halalHubOpenRoute}
                    >
                      <MaterialIcons name="map" size={20} color={colors.accent} />
                      <Text style={[styles.secondaryBtnTxt, { color: colors.accent }]}>
                        {kk.features.halalHubOpenRoute}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  {websiteUrl ? (
                    <Pressable
                      onPress={() => void Linking.openURL(websiteUrl)}
                      style={({ pressed }) => [
                        styles.secondaryBtn,
                        { borderColor: colors.border, backgroundColor: colors.bg, flex: 1 },
                        pressed && { opacity: 0.9 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={kk.features.halalHubWebsite}
                    >
                      <MaterialIcons name="language" size={20} color={colors.accent} />
                      <Text style={[styles.secondaryBtnTxt, { color: colors.accent }]}>{kk.features.halalHubWebsite}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() =>
                      void Share.share({
                        message: [detail.title, detail.address, phones[0], websiteUrl].filter(Boolean).join("\n"),
                      })
                    }
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      { borderColor: colors.border, backgroundColor: colors.bg, flex: 1 },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={kk.features.halalHubShareCompany}
                  >
                    <MaterialIcons name="ios-share" size={20} color={colors.accent} />
                    <Text style={[styles.secondaryBtnTxt, { color: colors.accent }]}>
                      {kk.features.halalHubShareCompany}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
  action,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: React.ReactNode;
  colors: ThemeColors;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={20} color={colors.accent} />
      <View style={styles.infoCol}>
        <View style={styles.infoLabelRow}>
          <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
          {action}
        </View>
        {typeof value === "string" ? (
          <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
  sheet: {
    maxHeight: "92%",
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  content: { padding: 16, paddingBottom: 24 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: "900", flex: 1 },
  loadingRow: { alignItems: "center", paddingVertical: 12, gap: 8 },
  loadingTxt: { fontSize: 13, fontWeight: "600" },
  loadErr: { fontSize: 12, marginBottom: 8, textAlign: "center" },
  hero: {
    minHeight: 140,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    padding: 16,
  },
  heroLogo: { width: "100%", height: 120, maxWidth: 280 },
  title: { fontSize: 22, fontWeight: "900", lineHeight: 28 },
  legal: { marginTop: 6, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 8 },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  catChipTxt: { fontSize: 11, fontWeight: "800" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 12 },
  infoCol: { flex: 1, gap: 2 },
  infoLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  infoLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  linkValue: { fontSize: 14, lineHeight: 22, fontWeight: "700" },
  inlineActions: { flexDirection: "row" },
  inlineActionTxt: { fontSize: 11, fontWeight: "800" },
  certLine: { marginTop: 8, fontSize: 12, fontWeight: "700" },
  updatedAt: { marginTop: 6, fontSize: 11, fontWeight: "600" },
  galleryBlock: { marginTop: 14 },
  galleryTitle: { fontSize: 14, fontWeight: "900", marginBottom: 8 },
  gallery: { marginTop: 2 },
  galleryImg: { width: 120, height: 88, borderRadius: 10, marginRight: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "900" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtnTxt: { fontSize: 14, fontWeight: "800" },
});
