import type { LocalFamilyPerson, LocalFamilyTree } from "./familyTreeLocal";
import { genFamilyId } from "./familyTreeLocal";

type GedcomIndi = {
  xref: string;
  name: string;
  gender: LocalFamilyPerson["gender"];
};

type GedcomFam = {
  husb?: string;
  wife?: string;
  children: string[];
};

function normalizeXref(raw: string): string {
  return raw.replace(/^@|@$/g, "").trim();
}

function parseNameLine(value: string): string {
  const v = value.trim();
  const slash = v.match(/^(.+?)\s*\/(.+?)\//);
  if (slash) {
    const given = slash[1]!.trim();
    const sur = slash[2]!.trim();
    return [given, sur].filter(Boolean).join(" ");
  }
  return v.replace(/\//g, "").trim();
}

function parseSex(value: string): LocalFamilyPerson["gender"] {
  const s = value.trim().toUpperCase();
  if (s === "M") return "male";
  if (s === "F") return "female";
  return "unknown";
}

/** Минималды GEDCOM 5.5 — INDI + FAM (HUSB/WIFE/CHIL). */
export function parseFamilyTreeGedcom(raw: string): { tree: LocalFamilyTree | null; error?: string } {
  const text = raw.trim();
  if (!text) return { tree: null, error: "empty" };

  const lines = text.split(/\r?\n/);
  const indis = new Map<string, GedcomIndi>();
  const fams: GedcomFam[] = [];

  let curIndi: GedcomIndi | null = null;
  let curFam: GedcomFam | null = null;
  let inBirt = false;
  let inDeat = false;

  for (const line of lines) {
    const m = line.match(/^(\d+)\s+(\S+)(?:\s+(.*))?$/);
    if (!m) continue;
    const level = Number(m[1]);
    const tag = m[2]!.toUpperCase();
    const value = (m[3] ?? "").trim();

    if (level === 0) {
      inBirt = false;
      inDeat = false;
      if (tag.startsWith("@") && value === "INDI") {
        const xref = normalizeXref(tag);
        curIndi = { xref, name: "", gender: "unknown" };
        indis.set(xref, curIndi);
        curFam = null;
      } else if (tag.startsWith("@") && value === "FAM") {
        curFam = { children: [] };
        fams.push(curFam);
        curIndi = null;
      } else {
        curIndi = null;
        curFam = null;
      }
      continue;
    }

    if (curIndi && level === 1) {
      if (tag === "NAME") curIndi.name = parseNameLine(value);
      if (tag === "SEX") curIndi.gender = parseSex(value);
      inBirt = tag === "BIRT";
      inDeat = tag === "DEAT";
    }
    if (curIndi && level === 2 && inBirt && tag === "DATE") {
      const y = value.match(/\d{4}/);
      if (y) (curIndi as GedcomIndi & { birthYear?: number }).birthYear = Number(y[0]);
    }

    if (curFam && level === 1) {
      if (tag === "HUSB") curFam.husb = normalizeXref(value);
      if (tag === "WIFE") curFam.wife = normalizeXref(value);
      if (tag === "CHIL") curFam.children.push(normalizeXref(value));
    }
  }

  if (indis.size === 0) return { tree: null, error: "no_indi" };

  const persons: LocalFamilyPerson[] = [];
  const idMap = new Map<string, string>();

  for (const [xref, indi] of indis) {
    const id = `ged_${xref.replace(/[^a-zA-Z0-9_-]/g, "_") || genFamilyId()}`;
    idMap.set(xref, id);
    const ext = indi as GedcomIndi & { birthYear?: number };
    persons.push({
      id,
      name: indi.name || xref,
      gender: indi.gender,
      birthYear: ext.birthYear ?? null,
      deathYear: null,
      clanSlug: null,
      clanLabel: null,
      notes: null,
      fatherId: null,
      motherId: null,
      isSelf: false,
    });
  }

  const byId = new Map(persons.map((p) => [p.id, p]));

  for (const fam of fams) {
    const fatherX = fam.husb;
    const motherX = fam.wife;
    const fatherId = fatherX ? idMap.get(fatherX) ?? null : null;
    const motherId = motherX ? idMap.get(motherX) ?? null : null;
    for (const childX of fam.children) {
      const childId = idMap.get(childX);
      if (!childId) continue;
      const p = byId.get(childId);
      if (!p) continue;
      if (fatherId && !p.fatherId) p.fatherId = fatherId;
      if (motherId && !p.motherId) p.motherId = motherId;
    }
  }

  const selfId = persons[0]?.id ?? null;
  if (selfId) {
    const self = byId.get(selfId);
    if (self) self.isSelf = true;
  }

  return {
    tree: {
      version: 1,
      selfId,
      persons: Array.from(byId.values()),
      updatedAt: Date.now(),
    },
  };
}

export function isLikelyGedcom(raw: string): boolean {
  const t = raw.trim();
  return /^0\s+HEAD/m.test(t) || /^0\s+@/m.test(t);
}
