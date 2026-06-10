import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Жергілікті (логинсіз) жеке шежіре. Әр адамда fatherId/motherId сілтемесі —
 * кез келген тереңдік (7+ ата) мүмкін. Болашақта бұлтқа синхрондауға дайын құрылым.
 */

const STORAGE_KEY = "raqat.familyTree.local.v1";

export type FamilyGender = "male" | "female" | "unknown";

export type LocalFamilyPerson = {
  id: string;
  name: string;
  gender: FamilyGender;
  birthYear?: number | null;
  deathYear?: number | null;
  clanSlug?: string | null;
  clanLabel?: string | null;
  notes?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  isSelf?: boolean;
};

export type LocalFamilyTree = {
  version: 1;
  selfId: string | null;
  persons: LocalFamilyPerson[];
  updatedAt: number;
};

export type FamilyTreeGenerationRow = {
  /** 1 — ата-ана, 2 — ата-әже, ... */
  depth: number;
  persons: LocalFamilyPerson[];
};

export function emptyFamilyTree(): LocalFamilyTree {
  return { version: 1, selfId: null, persons: [], updatedAt: Date.now() };
}

export function genFamilyId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadFamilyTree(): Promise<LocalFamilyTree> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyFamilyTree();
    const parsed = JSON.parse(raw) as LocalFamilyTree;
    if (!parsed || !Array.isArray(parsed.persons)) return emptyFamilyTree();
    return { version: 1, selfId: parsed.selfId ?? null, persons: parsed.persons, updatedAt: parsed.updatedAt ?? Date.now() };
  } catch {
    return emptyFamilyTree();
  }
}

export async function saveFamilyTree(tree: LocalFamilyTree): Promise<void> {
  const next = { ...tree, updatedAt: Date.now() };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* елемейміз — жергілікті сақтау сәтсіздігі сирек */
  }
}

export function getPerson(tree: LocalFamilyTree, id: string | null | undefined): LocalFamilyPerson | null {
  if (!id) return null;
  return tree.persons.find((p) => p.id === id) ?? null;
}

export function getSelf(tree: LocalFamilyTree): LocalFamilyPerson | null {
  return getPerson(tree, tree.selfId);
}

/** Жаңа адам қосу. relation — anchorId-ге қатысты. Жаңартылған ағашты қайтарады. */
export function addPersonToTree(
  tree: LocalFamilyTree,
  input: {
    name: string;
    gender?: FamilyGender;
    birthYear?: number | null;
    clanSlug?: string | null;
    clanLabel?: string | null;
  },
  relation: "father" | "mother" | "child",
  anchorId: string
): LocalFamilyTree {
  const anchor = getPerson(tree, anchorId);
  if (!anchor) return tree;
  const id = genFamilyId();
  const person: LocalFamilyPerson = {
    id,
    name: input.name.trim(),
    gender:
      input.gender ?? (relation === "father" ? "male" : relation === "mother" ? "female" : "unknown"),
    birthYear: input.birthYear ?? null,
    deathYear: null,
    clanSlug: input.clanSlug ?? null,
    clanLabel: input.clanLabel ?? null,
    notes: null,
    fatherId: null,
    motherId: null,
    isSelf: false,
  };

  let persons = [...tree.persons, person];
  if (relation === "child") {
    // anchor — баланың ата-анасы
    persons = persons.map((p) =>
      p.id === id
        ? { ...p, [anchor.gender === "female" ? "motherId" : "fatherId"]: anchor.id }
        : p
    );
  } else {
    // жаңа адам — anchor-дың әкесі/анасы
    persons = persons.map((p) =>
      p.id === anchor.id ? { ...p, [relation === "father" ? "fatherId" : "motherId"]: id } : p
    );
  }
  return { ...tree, persons };
}

export function setSelfPerson(
  tree: LocalFamilyTree,
  input: {
    name: string;
    gender?: FamilyGender;
    birthYear?: number | null;
    clanSlug?: string | null;
    clanLabel?: string | null;
  }
): LocalFamilyTree {
  const existing = getSelf(tree);
  if (existing) {
    const persons = tree.persons.map((p) =>
      p.id === existing.id
        ? {
            ...p,
            name: input.name.trim(),
            gender: input.gender ?? p.gender,
            birthYear: input.birthYear ?? null,
            clanSlug: input.clanSlug ?? null,
            clanLabel: input.clanLabel ?? null,
          }
        : p
    );
    return { ...tree, persons };
  }
  const id = genFamilyId();
  const self: LocalFamilyPerson = {
    id,
    name: input.name.trim(),
    gender: input.gender ?? "unknown",
    birthYear: input.birthYear ?? null,
    deathYear: null,
    clanSlug: input.clanSlug ?? null,
    clanLabel: input.clanLabel ?? null,
    notes: null,
    fatherId: null,
    motherId: null,
    isSelf: true,
  };
  return { ...tree, selfId: id, persons: [...tree.persons, self] };
}

export function updatePersonInTree(
  tree: LocalFamilyTree,
  id: string,
  patch: Partial<Omit<LocalFamilyPerson, "id">>
): LocalFamilyTree {
  const persons = tree.persons.map((p) => (p.id === id ? { ...p, ...patch } : p));
  return { ...tree, persons };
}

/** Адамды (және оған сілтемелерді) өшіру. */
export function deletePersonFromTree(tree: LocalFamilyTree, id: string): LocalFamilyTree {
  const persons = tree.persons
    .filter((p) => p.id !== id)
    .map((p) => ({
      ...p,
      fatherId: p.fatherId === id ? null : p.fatherId,
      motherId: p.motherId === id ? null : p.motherId,
    }));
  const selfId = tree.selfId === id ? null : tree.selfId;
  return { ...tree, selfId, persons };
}

/** Self-тен жоғары қарай ата-бабалар (буын-буын). */
export function ancestorsByGeneration(tree: LocalFamilyTree): FamilyTreeGenerationRow[] {
  const self = getSelf(tree);
  if (!self) return [];
  const rows: FamilyTreeGenerationRow[] = [];
  let frontier: LocalFamilyPerson[] = [self];
  let depth = 0;
  const guard = new Set<string>();
  while (depth < 30) {
    const next: LocalFamilyPerson[] = [];
    for (const p of frontier) {
      const f = getPerson(tree, p.fatherId);
      const m = getPerson(tree, p.motherId);
      if (f && !guard.has(f.id)) {
        guard.add(f.id);
        next.push(f);
      }
      if (m && !guard.has(m.id)) {
        guard.add(m.id);
        next.push(m);
      }
    }
    if (next.length === 0) break;
    depth += 1;
    rows.push({ depth, persons: next });
    frontier = next;
  }
  return rows;
}

/** Self-тен төмен қарай ұрпақтар (буын-буын). */
export function descendantsByGeneration(tree: LocalFamilyTree): FamilyTreeGenerationRow[] {
  const self = getSelf(tree);
  if (!self) return [];
  const rows: FamilyTreeGenerationRow[] = [];
  let frontier: LocalFamilyPerson[] = [self];
  let depth = 0;
  const guard = new Set<string>([self.id]);
  while (depth < 30) {
    const parentIds = new Set(frontier.map((p) => p.id));
    const children = tree.persons.filter(
      (p) =>
        !guard.has(p.id) &&
        ((p.fatherId && parentIds.has(p.fatherId)) || (p.motherId && parentIds.has(p.motherId)))
    );
    if (children.length === 0) break;
    children.forEach((c) => guard.add(c.id));
    depth += 1;
    rows.push({ depth, persons: children });
    frontier = children;
  }
  return rows;
}

export function searchFamilyPersons(tree: LocalFamilyTree, query: string): LocalFamilyPerson[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return tree.persons.filter((p) =>
    [p.name, p.clanLabel, p.clanSlug].filter(Boolean).join(" ").toLowerCase().includes(q)
  );
}

export function hasFather(tree: LocalFamilyTree, id: string): boolean {
  return !!getPerson(tree, id)?.fatherId;
}

export function hasMother(tree: LocalFamilyTree, id: string): boolean {
  return !!getPerson(tree, id)?.motherId;
}

export function familyLifeYearsLocal(p: LocalFamilyPerson): string | null {
  if (!p.birthYear && !p.deathYear) return null;
  if (p.birthYear && p.deathYear) return `${p.birthYear}–${p.deathYear}`;
  if (p.birthYear) return `${p.birthYear}–`;
  return `–${p.deathYear}`;
}
