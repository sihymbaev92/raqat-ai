import {
  ancestorsByGeneration,
  descendantsByGeneration,
  getPerson,
  getSelf,
  type LocalFamilyPerson,
  type LocalFamilyTree,
} from "./familyTreeLocal";

export const FAMILY_TREE_TARGET_PATERNAL_DEPTH = 7;

export type FamilyTreeMissingSlot = {
  anchorId: string;
  relation: "father" | "mother";
  depth: number;
  label: string;
};

export type FamilyTreeLineagePlan = {
  hasSelf: boolean;
  totalPersons: number;
  paternalDepth: number;
  targetPaternalDepth: number;
  knownAncestorCount: number;
  ancestorDepth: number;
  descendantDepth: number;
  ancestorCoveragePercent: number;
  paternalLine: LocalFamilyPerson[];
  missingSlots: FamilyTreeMissingSlot[];
};

const KIN_LABEL: Record<"father" | "mother", string> = {
  father: "әке",
  mother: "ана",
};

function nextRelationLabel(person: LocalFamilyPerson, relation: "father" | "mother"): string {
  return `${person.name}: ${KIN_LABEL[relation]} қосу`;
}

export function buildPaternalLine(tree: LocalFamilyTree, maxDepth = FAMILY_TREE_TARGET_PATERNAL_DEPTH): LocalFamilyPerson[] {
  const self = getSelf(tree);
  if (!self) return [];
  const line: LocalFamilyPerson[] = [];
  let cursor: LocalFamilyPerson | null = self;
  const seen = new Set<string>();
  while (cursor && cursor.fatherId && line.length < maxDepth) {
    const father = getPerson(tree, cursor.fatherId);
    if (!father || seen.has(father.id)) break;
    seen.add(father.id);
    line.push(father);
    cursor = father;
  }
  return line;
}

export function getNextPaternalMissingSlot(tree: LocalFamilyTree): FamilyTreeMissingSlot | null {
  const self = getSelf(tree);
  if (!self) return null;
  let cursor: LocalFamilyPerson | null = self;
  const seen = new Set<string>([self.id]);
  for (let depth = 1; depth <= FAMILY_TREE_TARGET_PATERNAL_DEPTH; depth += 1) {
    if (!cursor.fatherId) {
      return {
        anchorId: cursor.id,
        relation: "father",
        depth,
        label: nextRelationLabel(cursor, "father"),
      };
    }
    const father = getPerson(tree, cursor.fatherId);
    if (!father || seen.has(father.id)) return null;
    seen.add(father.id);
    cursor = father;
  }
  return null;
}

export function buildFamilyTreeLineagePlan(tree: LocalFamilyTree): FamilyTreeLineagePlan {
  const self = getSelf(tree);
  const ancestorRows = ancestorsByGeneration(tree);
  const descendantRows = descendantsByGeneration(tree);
  const paternalLine = buildPaternalLine(tree);
  const missingSlots: FamilyTreeMissingSlot[] = [];

  if (self) {
    let frontier: LocalFamilyPerson[] = [self];
    const seen = new Set<string>([self.id]);
    for (let depth = 1; depth <= FAMILY_TREE_TARGET_PATERNAL_DEPTH; depth += 1) {
      const next: LocalFamilyPerson[] = [];
      for (const person of frontier) {
        for (const relation of ["father", "mother"] as const) {
          const parentId = relation === "father" ? person.fatherId : person.motherId;
          const parent = getPerson(tree, parentId);
          if (parent && !seen.has(parent.id)) {
            seen.add(parent.id);
            next.push(parent);
          } else if (!parent) {
            missingSlots.push({
              anchorId: person.id,
              relation,
              depth,
              label: nextRelationLabel(person, relation),
            });
          }
        }
      }
      if (next.length === 0) break;
      frontier = next;
    }
  }

  const targetSlots = (2 ** (FAMILY_TREE_TARGET_PATERNAL_DEPTH + 1)) - 2;
  const knownAncestorCount = ancestorRows.reduce((sum, row) => sum + row.persons.length, 0);

  return {
    hasSelf: Boolean(self),
    totalPersons: tree.persons.length,
    paternalDepth: paternalLine.length,
    targetPaternalDepth: FAMILY_TREE_TARGET_PATERNAL_DEPTH,
    knownAncestorCount,
    ancestorDepth: ancestorRows.length ? Math.max(...ancestorRows.map((row) => row.depth)) : 0,
    descendantDepth: descendantRows.length ? Math.max(...descendantRows.map((row) => row.depth)) : 0,
    ancestorCoveragePercent: Math.round((Math.min(knownAncestorCount, targetSlots) / targetSlots) * 100),
    paternalLine,
    missingSlots,
  };
}
