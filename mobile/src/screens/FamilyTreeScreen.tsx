import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import {
  familyLifeYears,
  familyRelationLabel,
  fetchMeFamilyTree,
  postMeFamilyPerson,
  putMeFamilySelf,
  type AddPersonInput,
  type FamilyPerson,
  type FamilyTreeView,
} from "../services/familyTreeApi";
import { getValidAccessToken } from "../storage/authTokens";
import { useAppTheme } from "../theme/ThemeContext";
import { getTraditionKazakhPalette } from "../theme/traditionKazakhTheme";

type Nav = NativeStackNavigationProp<MoreStackParamList, "FamilyTree">;

type PendingAdd = {
  relation: "father" | "mother" | "child";
  relativeToId?: string | null;
  label: string;
};

function PersonCard({
  person,
  highlight,
  subtitle,
  colors,
  accent,
}: {
  person: FamilyPerson;
  highlight?: boolean;
  subtitle?: string;
  colors: { text: string; textMuted: string; card: string; border: string };
  accent: string;
}) {
  const years = familyLifeYears(person);
  const meta = [subtitle, years, person.clan_slug].filter(Boolean).join(" · ");
  return (
    <View
      style={[
        styles.personCard,
        { backgroundColor: colors.card, borderColor: highlight ? accent : colors.border },
        highlight && styles.personCardHighlight,
      ]}
    >
      <Text style={[styles.personName, { color: colors.text }]}>{person.name_kk}</Text>
      {meta ? <Text style={[styles.personMeta, { color: colors.textMuted }]}>{meta}</Text> : null}
    </View>
  );
}

export function FamilyTreeScreen() {
  const { colors, isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const nav = useNavigation<Nav>();
  const ft = kk.features;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [view, setView] = useState<FamilyTreeView | null>(null);

  const [selfName, setSelfName] = useState("");
  const [selfClan, setSelfClan] = useState("");
  const [selfBirth, setSelfBirth] = useState("");

  const [addPending, setAddPending] = useState<PendingAdd | null>(null);
  const [addName, setAddName] = useState("");
  const [editSelf, setEditSelf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsLogin(false);
    try {
      const token = await getValidAccessToken();
      if (!token) {
        setNeedsLogin(true);
        setView(null);
        return;
      }
      const data = await fetchMeFamilyTree(token);
      setView(data);
      if (data.self) {
        setSelfName(data.self.name_kk);
        setSelfClan(data.self.clan_slug ?? "");
        setSelfBirth(data.self.birth_year ? String(data.self.birth_year) : "");
      }
    } catch {
      setError(ft.familyTreeLoadError);
    } finally {
      setLoading(false);
    }
  }, [ft.familyTreeLoadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSelf = async () => {
    const name = selfName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getValidAccessToken();
      if (!token) {
        setNeedsLogin(true);
        return;
      }
      const birth = selfBirth.trim() ? parseInt(selfBirth, 10) : null;
      const data = await putMeFamilySelf(token, {
        name_kk: name,
        gender: "unknown",
        clan_slug: selfClan.trim() || null,
        birth_year: Number.isFinite(birth) ? birth : null,
      });
      setView(data);
    } catch {
      setError(ft.familyTreeSaveError);
    } finally {
      setSaving(false);
    }
  };

  const submitAdd = async () => {
    if (!addPending) return;
    const name = addName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getValidAccessToken();
      if (!token) {
        setNeedsLogin(true);
        return;
      }
      const { relation, relativeToId } = addPending;
      const payload: AddPersonInput = {
        name_kk: name,
        relation,
        relative_to_id: relativeToId ?? undefined,
        gender: relation === "mother" ? "female" : relation === "father" ? "male" : "unknown",
      };
      const data = await postMeFamilyPerson(token, payload);
      setView(data);
      setAddPending(null);
      setAddName("");
    } catch {
      setError(ft.familyTreeSaveError);
    } finally {
      setSaving(false);
    }
  };

  const ancestorRows = useMemo(() => {
    if (!view?.ancestors?.length) return [];
    return [...view.ancestors].sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0));
  }, [view?.ancestors]);

  const openAdd = (pending: PendingAdd) => {
    setAddPending(pending);
    setAddName("");
  };

  const uiColors = {
    text: colors.text,
    textMuted: colors.textMuted,
    card: isDark ? "#1a2420" : "#f7f4ef",
    border: isDark ? "#2a3530" : "#e0d8cc",
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  if (needsLogin) {
    return (
      <View style={[styles.centerPad, { backgroundColor: colors.bg }]}>
        <MaterialIcons name="account-tree" size={48} color={palette.accent} />
        <Text style={[styles.title, { color: colors.text }]}>{ft.familyTreeTitle}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>{ft.familyTreeLoginHint}</Text>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: palette.accent }]}
          onPress={() => nav.navigate("Settings")}
        >
          <Text style={styles.primaryBtnText}>{ft.familyTreeLoginCta}</Text>
        </Pressable>
      </View>
    );
  }

  const hasSelf = view?.has_self === true && view.self;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.scrollPad}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.intro, { color: colors.textMuted }]}>{ft.familyTreeIntro}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!hasSelf ? (
        <View style={[styles.formBox, { borderColor: uiColors.border, backgroundColor: uiColors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{ft.familyTreeSelfSetup}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: uiColors.border }]}
            placeholder={ft.familyTreeNamePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={selfName}
            onChangeText={setSelfName}
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: uiColors.border }]}
            placeholder={ft.familyTreeClanPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={selfClan}
            onChangeText={setSelfClan}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: uiColors.border }]}
            placeholder={ft.familyTreeBirthPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={selfBirth}
            onChangeText={setSelfBirth}
            keyboardType="number-pad"
          />
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: palette.accent, opacity: saving ? 0.7 : 1 }]}
            onPress={() => void saveSelf()}
            disabled={saving}
          >
            <Text style={styles.primaryBtnText}>{ft.familyTreeSaveSelf}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{ft.familyTreeAncestors}</Text>
          {ancestorRows.length === 0 && view!.parents.length === 0 ? (
            <Text style={[styles.emptyLine, { color: colors.textMuted }]}>{ft.familyTreeNoAncestors}</Text>
          ) : (
            ancestorRows.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                subtitle={`${ft.familyTreeGen} ${p.depth ?? ""}${familyRelationLabel(p.relation) ? ` · ${familyRelationLabel(p.relation)}` : ""}`}
                colors={uiColors}
                accent={palette.accent}
              />
            ))
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{ft.familyTreeSelf}</Text>
            <Pressable onPress={() => setEditSelf((v) => !v)}>
              <Text style={[styles.editLink, { color: palette.accent }]}>
                {editSelf ? ft.familyTreeCancel : ft.familyTreeSaveSelf}
              </Text>
            </Pressable>
          </View>
          {editSelf ? (
            <View style={[styles.formBox, { borderColor: uiColors.border, backgroundColor: uiColors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: uiColors.border }]}
                placeholder={ft.familyTreeNamePlaceholder}
                placeholderTextColor={colors.textMuted}
                value={selfName}
                onChangeText={setSelfName}
              />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: uiColors.border }]}
                placeholder={ft.familyTreeClanPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={selfClan}
                onChangeText={setSelfClan}
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: uiColors.border }]}
                placeholder={ft.familyTreeBirthPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={selfBirth}
                onChangeText={setSelfBirth}
                keyboardType="number-pad"
              />
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: palette.accent, opacity: saving ? 0.7 : 1 }]}
                onPress={() => void saveSelf().then(() => setEditSelf(false))}
                disabled={saving}
              >
                <Text style={styles.primaryBtnText}>{ft.familyTreeSaveSelf}</Text>
              </Pressable>
            </View>
          ) : (
            <PersonCard person={view!.self!} highlight colors={uiColors} accent={palette.accent} />
          )}

          <View style={styles.actionRow}>
            {!view!.parents.some((p) => p.relation === "father") ? (
              <Pressable
                style={[styles.chip, { borderColor: palette.accent }]}
                onPress={() => openAdd({ relation: "father", label: ft.familyTreeAddFather })}
              >
                <Text style={[styles.chipText, { color: palette.accent }]}>{ft.familyTreeAddFather}</Text>
              </Pressable>
            ) : null}
            {!view!.parents.some((p) => p.relation === "mother") ? (
              <Pressable
                style={[styles.chip, { borderColor: palette.accent }]}
                onPress={() => openAdd({ relation: "mother", label: ft.familyTreeAddMother })}
              >
                <Text style={[styles.chipText, { color: palette.accent }]}>{ft.familyTreeAddMother}</Text>
              </Pressable>
            ) : null}
            {(() => {
              const father = view!.parents.find((p) => p.relation === "father");
              const hasGrandfather = view!.ancestors.some((a) => a.depth === 2 && a.relation === "father");
              if (!father || hasGrandfather) return null;
              return (
                <Pressable
                  style={[styles.chip, { borderColor: palette.accent }]}
                  onPress={() =>
                    openAdd({
                      relation: "father",
                      relativeToId: father.id,
                      label: ft.familyTreeAddGrandfather,
                    })
                  }
                >
                  <Text style={[styles.chipText, { color: palette.accent }]}>{ft.familyTreeAddGrandfather}</Text>
                </Pressable>
              );
            })()}
            {(() => {
              const mother = view!.parents.find((p) => p.relation === "mother");
              const hasGrandmother = view!.ancestors.some((a) => a.depth === 2 && a.relation === "mother");
              if (!mother || hasGrandmother) return null;
              return (
                <Pressable
                  style={[styles.chip, { borderColor: palette.accent }]}
                  onPress={() =>
                    openAdd({
                      relation: "mother",
                      relativeToId: mother.id,
                      label: ft.familyTreeAddGrandmother,
                    })
                  }
                >
                  <Text style={[styles.chipText, { color: palette.accent }]}>{ft.familyTreeAddGrandmother}</Text>
                </Pressable>
              );
            })()}
            <Pressable
              style={[styles.chip, { borderColor: palette.accent }]}
              onPress={() => openAdd({ relation: "child", label: ft.familyTreeAddChild })}
            >
              <Text style={[styles.chipText, { color: palette.accent }]}>{ft.familyTreeAddChild}</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>{ft.familyTreeDescendants}</Text>
          {view!.descendants.length === 0 ? (
            <Text style={[styles.emptyLine, { color: colors.textMuted }]}>{ft.familyTreeNoChildren}</Text>
          ) : (
            view!.descendants.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                subtitle={`${ft.familyTreeGen} ${p.depth ?? ""}`}
                colors={uiColors}
                accent={palette.accent}
              />
            ))
          )}
        </>
      )}

      {addPending ? (
        <View style={[styles.formBox, { borderColor: uiColors.border, backgroundColor: uiColors.card, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{addPending.label}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: uiColors.border }]}
            placeholder={ft.familyTreeNamePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={addName}
            onChangeText={setAddName}
            autoFocus
          />
          <View style={styles.rowBtns}>
            <Pressable style={styles.secondaryBtn} onPress={() => setAddPending(null)}>
              <Text style={{ color: colors.textMuted }}>{ft.familyTreeCancel}</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: palette.accent, flex: 1, opacity: saving ? 0.7 : 1 }]}
              onPress={() => void submitAdd()}
              disabled={saving}
            >
              <Text style={styles.primaryBtnText}>{ft.familyTreeSave}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerPad: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  scrollPad: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  hint: { fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 8 },
  error: { color: "#c0392b", marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  editLink: { fontSize: 14, fontWeight: "600" },
  emptyLine: { fontSize: 14, marginBottom: 8, fontStyle: "italic" },
  personCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  personCardHighlight: { borderWidth: 2 },
  personName: { fontSize: 16, fontWeight: "600" },
  personMeta: { fontSize: 13, marginTop: 4 },
  formBox: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 14, fontWeight: "600" },
  rowBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
});
