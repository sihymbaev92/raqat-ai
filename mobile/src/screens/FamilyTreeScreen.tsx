import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { ClanPickerModal } from "../components/genealogy/ClanPickerModal";
import { kk } from "../i18n/kk";
import {
  addPersonToTree,
  ancestorsByGeneration,
  deletePersonFromTree,
  descendantsByGeneration,
  emptyFamilyTree,
  familyLifeYearsLocal,
  getPerson,
  getSelf,
  loadFamilyTree,
  saveFamilyTree,
  searchFamilyPersons,
  setSelfPerson,
  updatePersonInTree,
  type FamilyGender,
  type LocalFamilyPerson,
  type LocalFamilyTree,
} from "../storage/familyTreeLocal";
import {
  buildFamilyTreeLineagePlan,
  getNextPaternalMissingSlot,
  type FamilyTreeLineagePlan,
} from "../storage/familyTreeLineage";
import {
  mergeImportedTree,
  exportFamilyTreeJson,
  parseFamilyTreeImportJson,
  parseFamilyTreeImport,
} from "../storage/familyTreeImport";
import {
  pushFamilyTreeToServerIfLoggedIn,
  syncFamilyTreeWithServerBidirectional,
} from "../storage/familyTreeSync";
import { useAppTheme } from "../theme/ThemeContext";
import { getTraditionKazakhPalette } from "../theme/traditionKazakhTheme";

type EditorMode =
  | { kind: "self" }
  | { kind: "add"; relation: "father" | "mother" | "child"; anchorId: string }
  | { kind: "edit"; personId: string };

export function FamilyTreeScreen() {
  const { colors, isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const ft = kk.features;
  const s = useMemo(() => makeStyles(palette), [palette]);

  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<LocalFamilyTree>(emptyFamilyTree());
  const [query, setQuery] = useState("");

  const [editor, setEditor] = useState<EditorMode | null>(null);
  const [fName, setFName] = useState("");
  const [fGender, setFGender] = useState<FamilyGender>("unknown");
  const [fBirth, setFBirth] = useState("");
  const [fClanSlug, setFClanSlug] = useState<string | null>(null);
  const [fClanLabel, setFClanLabel] = useState<string | null>(null);
  const [clanPickerOpen, setClanPickerOpen] = useState(false);
  const [actionPerson, setActionPerson] = useState<LocalFamilyPerson | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [syncedHint, setSyncedHint] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const t = await syncFamilyTreeWithServerBidirectional();
      setTree(t);
      setSyncedHint(t.persons.length > 0);
    } catch {
      const t = await loadFamilyTree();
      setTree(t);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const persist = useCallback(async (next: LocalFamilyTree) => {
    setTree(next);
    await saveFamilyTree(next);
    void pushFamilyTreeToServerIfLoggedIn(next);
  }, []);

  const self = getSelf(tree);
  const ancestorRows = useMemo(() => ancestorsByGeneration(tree), [tree]);
  const descendantRows = useMemo(() => descendantsByGeneration(tree), [tree]);
  const searchHits = useMemo(() => searchFamilyPersons(tree, query), [tree, query]);
  const lineagePlan = useMemo(() => buildFamilyTreeLineagePlan(tree), [tree]);

  const resetFields = (p?: LocalFamilyPerson | null, gender?: FamilyGender) => {
    setFName(p?.name ?? "");
    setFGender(gender ?? p?.gender ?? "unknown");
    setFBirth(p?.birthYear ? String(p.birthYear) : "");
    setFClanSlug(p?.clanSlug ?? null);
    setFClanLabel(p?.clanLabel ?? null);
  };

  const openSelfEditor = () => {
    resetFields(self);
    setEditor({ kind: "self" });
  };
  const openAdd = (relation: "father" | "mother" | "child", anchorId: string) => {
    setActionPerson(null);
    resetFields(null, relation === "father" ? "male" : relation === "mother" ? "female" : "unknown");
    setEditor({ kind: "add", relation, anchorId });
  };
  const openEdit = (p: LocalFamilyPerson) => {
    setActionPerson(null);
    resetFields(p);
    setEditor({ kind: "edit", personId: p.id });
  };

  const closeEditor = () => {
    setEditor(null);
    setFName("");
    setFClanSlug(null);
    setFClanLabel(null);
  };

  const submitEditor = async () => {
    if (!editor) return;
    const name = fName.trim();
    if (!name) return;
    const birth = fBirth.trim() ? parseInt(fBirth, 10) : null;
    const common = {
      name,
      gender: fGender,
      birthYear: Number.isFinite(birth as number) ? birth : null,
      clanSlug: fClanSlug,
      clanLabel: fClanLabel,
    };
    let next = tree;
    if (editor.kind === "self") {
      next = setSelfPerson(tree, common);
    } else if (editor.kind === "add") {
      next = addPersonToTree(tree, common, editor.relation, editor.anchorId);
    } else {
      next = updatePersonInTree(tree, editor.personId, common);
    }
    await persist(next);
    closeEditor();
  };

  const confirmDelete = (p: LocalFamilyPerson) => {
    setActionPerson(null);
    Alert.alert(ft.familyTreeDelete, `${p.name} — ${ft.familyTreeDeleteConfirm}`, [
      { text: ft.familyTreeCancel, style: "cancel" },
      {
        text: ft.familyTreeDelete,
        style: "destructive",
        onPress: () => void persist(deletePersonFromTree(tree, p.id)),
      },
    ]);
  };

  const clanText = fClanLabel ?? (fClanSlug || ft.familyTreeChooseClan);

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <RaqatOrnamentSpinner size={52} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={s.scrollPad}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[s.intro, { color: colors.muted }]}>{ft.familyTreeLocalIntro}</Text>
      {syncedHint ? (
        <Text style={[s.syncHint, { color: colors.accent }]}>{ft.familyTreeSyncHint}</Text>
      ) : null}

      <View style={s.toolRow}>
        <Pressable
          style={({ pressed }) => [s.toolBtn, pressed && { opacity: 0.9 }]}
          onPress={() => {
            setImportText("");
            setImportOpen(true);
          }}
        >
          <MaterialIcons name="file-upload" size={18} color={colors.accent} />
          <Text style={[s.toolTxt, { color: colors.text }]}>{ft.familyTreeImport}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.toolBtn, pressed && { opacity: 0.9 }]}
          onPress={() => void Clipboard.setStringAsync(exportFamilyTreeJson(tree))}
        >
          <MaterialIcons name="content-copy" size={18} color={colors.accent} />
          <Text style={[s.toolTxt, { color: colors.text }]}>{ft.familyTreeExport}</Text>
        </Pressable>
      </View>

      <View style={[s.searchWrap, { borderColor: palette.border, backgroundColor: palette.cardBg }]}>
        <MaterialIcons name="search" size={20} color={palette.muted} />
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          placeholder={ft.familyTreeSearchPlaceholder}
          placeholderTextColor={palette.muted}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {query.trim() ? (
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>{ft.familyTreeSearchResults}</Text>
          {searchHits.length === 0 ? (
            <Text style={[s.emptyLine, { color: colors.muted }]}>{ft.genealogySearchEmpty}</Text>
          ) : (
            searchHits.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                palette={palette}
                colors={colors}
                highlight={p.isSelf}
                onPress={() => setActionPerson(p)}
              />
            ))
          )}
        </View>
      ) : !self ? (
        <View style={[s.formBox, { borderColor: palette.border, backgroundColor: palette.cardBg }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>{ft.familyTreeSelfSetup}</Text>
          <SelfEditorFields
            colors={colors}
            palette={palette}
            name={fName}
            setName={setFName}
            gender={fGender}
            setGender={setFGender}
            birth={fBirth}
            setBirth={setFBirth}
            clanText={clanText}
            onPickClan={() => setClanPickerOpen(true)}
            ft={ft}
          />
          <Pressable
            style={[s.primaryBtn, { backgroundColor: palette.gold }]}
            onPress={() => {
              resetFields(null);
              setEditor({ kind: "self" });
            }}
          >
            <Text style={s.primaryBtnText}>{ft.familyTreeSaveSelf}</Text>
          </Pressable>
          <Text style={[s.hintSmall, { color: colors.muted }]}>{ft.familyTreeAncestorHint}</Text>
        </View>
      ) : (
        <>
          <LineageSystemCard
            plan={lineagePlan}
            palette={palette}
            colors={colors}
            ft={ft}
            onAddPaternal={() => {
              const slot = getNextPaternalMissingSlot(tree);
              if (slot) openAdd(slot.relation, slot.anchorId);
            }}
            onAddSlot={(slot) => openAdd(slot.relation, slot.anchorId)}
          />

          {/* Ата-бабалар: ең үлкен буыннан төмен қарай */}
          <Text style={[s.sectionTitle, { color: colors.text }]}>{ft.familyTreeAncestors}</Text>
          {ancestorRows.length === 0 ? (
            <Text style={[s.emptyLine, { color: colors.muted }]}>{ft.familyTreeNoAncestors}</Text>
          ) : (
            [...ancestorRows].reverse().map((row) => (
              <View key={`anc-${row.depth}`}>
                <Text style={[s.genLabel, { color: palette.gold }]}>{ft.familyTreeGenLabel(row.depth)}</Text>
                {row.persons.map((p) => (
                  <PersonCard
                    key={p.id}
                    person={p}
                    palette={palette}
                    colors={colors}
                    onPress={() => setActionPerson(p)}
                  />
                ))}
              </View>
            ))
          )}
          <Text style={[s.hintSmall, { color: colors.muted, marginBottom: 12 }]}>{ft.familyTreeAncestorHint}</Text>

          {/* Мен */}
          <Text style={[s.sectionTitle, { color: colors.text }]}>{ft.familyTreeSelf}</Text>
          <PersonCard
            person={self}
            palette={palette}
            colors={colors}
            highlight
            onPress={() => setActionPerson(self)}
          />

          {/* Ұрпақтар */}
          <Text style={[s.sectionTitle, { color: colors.text, marginTop: 16 }]}>{ft.familyTreeDescendants}</Text>
          {descendantRows.length === 0 ? (
            <Text style={[s.emptyLine, { color: colors.muted }]}>{ft.familyTreeNoChildren}</Text>
          ) : (
            descendantRows.map((row) => (
              <View key={`desc-${row.depth}`}>
                {row.persons.map((p) => (
                  <PersonCard
                    key={p.id}
                    person={p}
                    palette={palette}
                    colors={colors}
                    onPress={() => setActionPerson(p)}
                  />
                ))}
              </View>
            ))
          )}
        </>
      )}

      {/* Адам әрекеттері */}
      <Modal
        visible={actionPerson != null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionPerson(null)}
      >
        <View style={s.modalRoot}>
          <Pressable style={s.modalBackdrop} onPress={() => setActionPerson(null)} />
          <View style={[s.actionSheet, { backgroundColor: colors.bg }]}>
            <Text style={[s.actionTitle, { color: colors.text }]}>{actionPerson?.name}</Text>
            {actionPerson && !actionPerson.fatherId ? (
              <ActionRow icon="male" label={ft.familyTreeAddFatherTo} palette={palette} colors={colors}
                onPress={() => openAdd("father", actionPerson.id)} />
            ) : null}
            {actionPerson && !actionPerson.motherId ? (
              <ActionRow icon="female" label={ft.familyTreeAddMotherTo} palette={palette} colors={colors}
                onPress={() => openAdd("mother", actionPerson.id)} />
            ) : null}
            {actionPerson ? (
              <ActionRow icon="child-care" label={ft.familyTreeAddChildTo} palette={palette} colors={colors}
                onPress={() => openAdd("child", actionPerson.id)} />
            ) : null}
            {actionPerson ? (
              <ActionRow icon="edit" label={ft.familyTreeEdit} palette={palette} colors={colors}
                onPress={() => openEdit(actionPerson)} />
            ) : null}
            {actionPerson ? (
              <ActionRow icon="delete-outline" label={ft.familyTreeDelete} palette={palette} colors={colors} danger
                onPress={() => confirmDelete(actionPerson)} />
            ) : null}
            <Pressable style={[s.closeBtn, { borderColor: palette.border }]} onPress={() => setActionPerson(null)}>
              <Text style={[s.closeTxt, { color: colors.text }]}>{ft.familyTreeCancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Қосу/Өңдеу редакторы */}
      <Modal visible={editor != null} transparent animationType="slide" onRequestClose={closeEditor}>
        <View style={s.modalRoot}>
          <Pressable style={s.modalBackdrop} onPress={closeEditor} />
          <View style={[s.editorSheet, { backgroundColor: colors.bg }]}>
            <View style={s.handle} />
            <Text style={[s.sectionTitle, { color: colors.text }]}>{editorTitle(editor, tree, ft)}</Text>
            <SelfEditorFields
              colors={colors}
              palette={palette}
              name={fName}
              setName={setFName}
              gender={fGender}
              setGender={setFGender}
              birth={fBirth}
              setBirth={setFBirth}
              clanText={clanText}
              onPickClan={() => setClanPickerOpen(true)}
              ft={ft}
            />
            <View style={s.rowBtns}>
              <Pressable style={s.secondaryBtn} onPress={closeEditor}>
                <Text style={{ color: colors.muted }}>{ft.familyTreeCancel}</Text>
              </Pressable>
              <Pressable
                style={[s.primaryBtn, { backgroundColor: palette.gold, flex: 1, opacity: fName.trim() ? 1 : 0.5 }]}
                onPress={() => void submitEditor()}
                disabled={!fName.trim()}
              >
                <Text style={s.primaryBtnText}>{ft.familyTreeSave}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={importOpen} transparent animationType="fade" onRequestClose={() => setImportOpen(false)}>
        <View style={s.modalRoot}>
          <Pressable style={s.modalBackdrop} onPress={() => setImportOpen(false)} />
          <View style={[s.editorSheet, { backgroundColor: colors.bg, maxHeight: "80%" }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>{ft.familyTreeImportTitle}</Text>
            <Text style={[s.hintSmall, { color: colors.muted }]}>{ft.familyTreeImportHint}</Text>
            <TextInput
              style={[s.importArea, { color: colors.text, borderColor: palette.border }]}
              multiline
              placeholder={ft.familyTreeImportPaste}
              placeholderTextColor={colors.muted}
              value={importText}
              onChangeText={setImportText}
            />
            <View style={s.rowBtns}>
              <Pressable style={s.secondaryBtn} onPress={() => setImportOpen(false)}>
                <Text style={{ color: colors.muted }}>{ft.familyTreeCancel}</Text>
              </Pressable>
              <Pressable
                style={[s.primaryBtn, { backgroundColor: palette.gold, flex: 1 }]}
                onPress={() => {
                  const { tree: imported, error } = parseFamilyTreeImport(importText);
                  if (!imported || error) {
                    Alert.alert(ft.familyTreeImportError);
                    return;
                  }
                  void persist(mergeImportedTree(tree, imported));
                  setImportOpen(false);
                  Alert.alert(ft.familyTreeImportOk);
                }}
              >
                <Text style={s.primaryBtnText}>{ft.familyTreeImport}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ClanPickerModal
        visible={clanPickerOpen}
        onClose={() => setClanPickerOpen(false)}
        onSelect={(c) => {
          setFClanSlug(c.slug);
          setFClanLabel(c.label);
        }}
      />
    </ScrollView>
  );
}

function editorTitle(editor: EditorMode | null, tree: LocalFamilyTree, ft: typeof kk.features): string {
  if (!editor) return "";
  if (editor.kind === "self") return ft.familyTreeSelfSetup;
  if (editor.kind === "edit") return ft.familyTreeEdit;
  const anchor = getPerson(tree, editor.anchorId);
  const who = anchor?.name ?? "";
  if (editor.relation === "father") return `${who}: ${ft.familyTreeAddFatherTo}`;
  if (editor.relation === "mother") return `${who}: ${ft.familyTreeAddMotherTo}`;
  return `${who}: ${ft.familyTreeAddChildTo}`;
}

function ActionRow({
  icon,
  label,
  onPress,
  palette,
  colors,
  danger,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  onPress: () => void;
  palette: ReturnType<typeof getTraditionKazakhPalette>;
  colors: ReturnType<typeof useAppTheme>["colors"];
  danger?: boolean;
}) {
  return (
    <Pressable style={actionStyles.row} onPress={onPress}>
      <MaterialIcons name={icon} size={22} color={danger ? "#c0392b" : palette.gold} />
      <Text style={[actionStyles.label, { color: danger ? "#c0392b" : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function SelfEditorFields({
  colors,
  palette,
  name,
  setName,
  gender,
  setGender,
  birth,
  setBirth,
  clanText,
  onPickClan,
  ft,
}: {
  colors: ReturnType<typeof useAppTheme>["colors"];
  palette: ReturnType<typeof getTraditionKazakhPalette>;
  name: string;
  setName: (v: string) => void;
  gender: FamilyGender;
  setGender: (g: FamilyGender) => void;
  birth: string;
  setBirth: (v: string) => void;
  clanText: string;
  onPickClan: () => void;
  ft: typeof kk.features;
}) {
  return (
    <View style={{ gap: 10 }}>
      <TextInput
        style={[fieldStyles.input, { color: colors.text, borderColor: palette.border }]}
        placeholder={ft.familyTreeNamePlaceholder}
        placeholderTextColor={palette.muted}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <View style={fieldStyles.genderRow}>
        <GenderBtn label={ft.familyTreeGenderMale} active={gender === "male"} onPress={() => setGender("male")} palette={palette} colors={colors} />
        <GenderBtn label={ft.familyTreeGenderFemale} active={gender === "female"} onPress={() => setGender("female")} palette={palette} colors={colors} />
      </View>
      <TextInput
        style={[fieldStyles.input, { color: colors.text, borderColor: palette.border }]}
        placeholder={ft.familyTreeBirthPlaceholder}
        placeholderTextColor={palette.muted}
        value={birth}
        onChangeText={setBirth}
        keyboardType="number-pad"
      />
      <Pressable style={[fieldStyles.clanBtn, { borderColor: palette.border }]} onPress={onPickClan}>
        <MaterialIcons name="account-tree" size={18} color={palette.gold} />
        <Text style={[fieldStyles.clanTxt, { color: colors.text }]} numberOfLines={1}>{clanText}</Text>
        <MaterialIcons name="chevron-right" size={20} color={palette.muted} />
      </Pressable>
    </View>
  );
}

function GenderBtn({
  label,
  active,
  onPress,
  palette,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  palette: ReturnType<typeof getTraditionKazakhPalette>;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  return (
    <Pressable
      style={[
        fieldStyles.genderBtn,
        { borderColor: active ? palette.gold : palette.border, backgroundColor: active ? palette.goldSurface : "transparent" },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: active ? palette.gold : colors.muted, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function LineageSystemCard({
  plan,
  palette,
  colors,
  ft,
  onAddPaternal,
  onAddSlot,
}: {
  plan: FamilyTreeLineagePlan;
  palette: ReturnType<typeof getTraditionKazakhPalette>;
  colors: ReturnType<typeof useAppTheme>["colors"];
  ft: typeof kk.features;
  onAddPaternal: () => void;
  onAddSlot: (slot: FamilyTreeLineagePlan["missingSlots"][number]) => void;
}) {
  const nextSlots = plan.missingSlots.slice(0, 4);
  const paternalDone = plan.paternalDepth >= plan.targetPaternalDepth;
  return (
    <View style={[lineageStyles.card, { backgroundColor: palette.cardBg, borderColor: palette.border }]}>
      <View style={lineageStyles.head}>
        <View style={[lineageStyles.icon, { backgroundColor: palette.goldSurface }]}>
          <MaterialIcons name="account-tree" size={22} color={palette.gold} />
        </View>
        <View style={lineageStyles.headText}>
          <Text style={[lineageStyles.title, { color: colors.text }]}>{ft.familyTreeSystemTitle}</Text>
          <Text style={[lineageStyles.subtitle, { color: colors.muted }]}>{ft.familyTreeSystemSubtitle}</Text>
        </View>
      </View>

      <View style={lineageStyles.statRow}>
        <LineageStat label={ft.familyTreeSystemPaternalLine} value={`${plan.paternalDepth}/${plan.targetPaternalDepth}`} palette={palette} colors={colors} />
        <LineageStat label={ft.familyTreeSystemAncestors} value={`${plan.knownAncestorCount}`} palette={palette} colors={colors} />
        <LineageStat label={ft.familyTreeSystemToday} value={`${plan.descendantDepth}`} palette={palette} colors={colors} />
      </View>
      <Text style={[lineageStyles.coverage, { color: colors.muted }]}>
        {ft.familyTreeSystemCoverage(plan.ancestorCoveragePercent, plan.totalPersons)}
      </Text>

      <View style={[lineageStyles.progressTrack, { backgroundColor: palette.goldSurface }]}>
        <View
          style={[
            lineageStyles.progressFill,
            { backgroundColor: palette.gold, width: `${Math.min(100, (plan.paternalDepth / plan.targetPaternalDepth) * 100)}%` },
          ]}
        />
      </View>

      <Text style={[lineageStyles.todoTitle, { color: colors.text }]}>{ft.familyTreeSystemNextTitle}</Text>
      {paternalDone ? (
        <Text style={[lineageStyles.todoText, { color: colors.muted }]}>{ft.familyTreeSystemPaternalDone}</Text>
      ) : (
        <Pressable
          style={({ pressed }) => [lineageStyles.primaryAction, { backgroundColor: palette.gold }, pressed && { opacity: 0.9 }]}
          onPress={onAddPaternal}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={lineageStyles.primaryActionText}>{ft.familyTreeSystemAddNextFather}</Text>
        </Pressable>
      )}

      {nextSlots.length > 0 ? (
        <View style={lineageStyles.slotList}>
          {nextSlots.map((slot) => (
            <Pressable
              key={`${slot.anchorId}-${slot.relation}-${slot.depth}`}
              style={({ pressed }) => [
                lineageStyles.slotRow,
                { borderColor: palette.border, backgroundColor: palette.goldSurface },
                pressed && { opacity: 0.88 },
              ]}
              onPress={() => onAddSlot(slot)}
            >
              <Text style={[lineageStyles.slotText, { color: colors.text }]} numberOfLines={1}>
                {slot.depth}-буын · {slot.label}
              </Text>
              <MaterialIcons name="chevron-right" size={18} color={palette.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function LineageStat({
  label,
  value,
  palette,
  colors,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof getTraditionKazakhPalette>;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  return (
    <View style={[lineageStyles.stat, { borderColor: palette.border }]}>
      <Text style={[lineageStyles.statValue, { color: palette.gold }]}>{value}</Text>
      <Text style={[lineageStyles.statLabel, { color: colors.muted }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function PersonCard({
  person,
  palette,
  colors,
  highlight,
  onPress,
}: {
  person: LocalFamilyPerson;
  palette: ReturnType<typeof getTraditionKazakhPalette>;
  colors: ReturnType<typeof useAppTheme>["colors"];
  highlight?: boolean;
  onPress: () => void;
}) {
  const years = familyLifeYearsLocal(person);
  const meta = [person.clanLabel ?? person.clanSlug, years].filter(Boolean).join(" · ");
  return (
    <Pressable
      style={[
        cardStyles.card,
        { backgroundColor: palette.cardBg, borderColor: highlight ? palette.gold : palette.border },
        highlight && cardStyles.highlight,
      ]}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={[cardStyles.name, { color: colors.text }]}>{person.name}</Text>
        {meta ? <Text style={[cardStyles.meta, { color: colors.muted }]}>{meta}</Text> : null}
      </View>
      <MaterialIcons name="more-horiz" size={22} color={palette.muted} />
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  highlight: { borderWidth: 2 },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, marginTop: 4 },
});

const actionStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  label: { fontSize: 16, fontWeight: "600" },
});

const fieldStyles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  genderRow: { flexDirection: "row", gap: 10 },
  genderBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  clanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  clanTxt: { flex: 1, fontSize: 15, fontWeight: "600" },
});

const lineageStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  headText: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  statRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 9 },
  statValue: { fontSize: 17, fontWeight: "900" },
  statLabel: { fontSize: 10, lineHeight: 14, marginTop: 2, fontWeight: "700" },
  coverage: { fontSize: 12, lineHeight: 17 },
  progressTrack: { height: 8, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  todoTitle: { fontSize: 13, fontWeight: "900" },
  todoText: { fontSize: 12, lineHeight: 17 },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
  },
  primaryActionText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  slotList: { gap: 6 },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  slotText: { flex: 1, fontSize: 12, fontWeight: "700" },
});

function makeStyles(palette: ReturnType<typeof getTraditionKazakhPalette>) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    scrollPad: { padding: 16, paddingBottom: 48 },
    intro: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
    syncHint: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
    toolRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    toolBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.border,
    },
    toolTxt: { fontSize: 12, fontWeight: "700" },
    importArea: {
      minHeight: 120,
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      marginTop: 10,
      textAlignVertical: "top",
      fontSize: 13,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 14,
    },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 16 },
    section: { marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
    genLabel: { fontSize: 12, fontWeight: "800", marginBottom: 4, textTransform: "uppercase" },
    emptyLine: { fontSize: 14, marginBottom: 8, fontStyle: "italic" },
    hintSmall: { fontSize: 12, lineHeight: 17, marginTop: 4 },
    formBox: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
    primaryBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
    primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    secondaryBtn: { paddingVertical: 12, paddingHorizontal: 16 },
    rowBtns: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
    modalRoot: { flex: 1, justifyContent: "flex-end" },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
    actionSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
    actionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 4 },
    editorSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
    handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: palette.border, marginBottom: 12 },
    closeBtn: { marginTop: 10, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
    closeTxt: { fontSize: 15, fontWeight: "700" },
  });
}
