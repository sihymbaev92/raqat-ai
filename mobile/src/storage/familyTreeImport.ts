import type { LocalFamilyTree } from "./familyTreeLocal";
import { emptyFamilyTree } from "./familyTreeLocal";
import { isLikelyGedcom, parseFamilyTreeGedcom } from "./familyTreeGedcomImport";

/** JSON немесе GEDCOM импорт. */
export function parseFamilyTreeImport(raw: string): { tree: LocalFamilyTree | null; error?: string } {
  if (isLikelyGedcom(raw)) return parseFamilyTreeGedcom(raw);
  return parseFamilyTreeImportJson(raw);
}

/** JSON импорт: LocalFamilyTree v1 немесе { persons, selfId } */
export function parseFamilyTreeImportJson(raw: string): { tree: LocalFamilyTree | null; error?: string } {
  const t = raw.trim();
  if (!t) return { tree: null, error: "empty" };
  try {
    const j = JSON.parse(t) as unknown;
    if (!j || typeof j !== "object") return { tree: null, error: "invalid" };
    const o = j as Record<string, unknown>;
    if (o.version === 1 && Array.isArray(o.persons)) {
      const tree = o as LocalFamilyTree;
      if (!tree.persons.every((p) => p && typeof p.id === "string" && typeof p.name === "string")) {
        return { tree: null, error: "invalid_persons" };
      }
      return {
        tree: {
          version: 1,
          selfId: typeof tree.selfId === "string" ? tree.selfId : null,
          persons: tree.persons,
          updatedAt: Date.now(),
        },
      };
    }
    if (Array.isArray(o.persons)) {
      const persons = o.persons as LocalFamilyTree["persons"];
      return {
        tree: {
          version: 1,
          selfId: typeof o.selfId === "string" ? o.selfId : null,
          persons,
          updatedAt: Date.now(),
        },
      };
    }
    return { tree: null, error: "invalid" };
  } catch {
    return { tree: null, error: "parse" };
  }
}

export function exportFamilyTreeJson(tree: LocalFamilyTree): string {
  return JSON.stringify(tree, null, 2);
}

export function mergeImportedTree(current: LocalFamilyTree, imported: LocalFamilyTree): LocalFamilyTree {
  if (!imported.persons.length) return current;
  return { ...imported, updatedAt: Date.now() };
}

export function emptyImportTree(): LocalFamilyTree {
  return emptyFamilyTree();
}
