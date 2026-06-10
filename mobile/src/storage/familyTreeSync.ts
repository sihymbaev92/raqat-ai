import { getRaqatApiBase } from "../config/raqatApiBase";
import { fetchMeFamilyTree, putMeFamilyTree } from "../services/familyTreeApi";
import { getValidAccessToken } from "./authTokens";
import {
  emptyFamilyTree,
  loadFamilyTree,
  saveFamilyTree,
  type LocalFamilyPerson,
  type LocalFamilyTree,
} from "./familyTreeLocal";

type RemotePerson = {
  id: string;
  name_kk?: string;
  name?: string;
  gender?: string;
  birth_year?: number | null;
  death_year?: number | null;
  clan_slug?: string | null;
  notes_kk?: string | null;
  father_id?: string | null;
  mother_id?: string | null;
  is_self?: boolean;
};

type RemoteSync = {
  self_id?: string | null;
  persons?: RemotePerson[];
  updated_at?: string | null;
};

function parseRemoteUpdatedMs(iso: string | null | undefined): number {
  if (!iso?.trim()) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function remoteToLocal(sync: RemoteSync): LocalFamilyTree {
  const persons: LocalFamilyPerson[] = (sync.persons ?? []).map((p) => ({
    id: p.id,
    name: (p.name_kk ?? p.name ?? "").trim(),
    gender:
      p.gender === "male" || p.gender === "female" || p.gender === "unknown"
        ? p.gender
        : "unknown",
    birthYear: p.birth_year ?? null,
    deathYear: p.death_year ?? null,
    clanSlug: p.clan_slug ?? null,
    clanLabel: null,
    notes: p.notes_kk ?? null,
    fatherId: p.father_id ?? null,
    motherId: p.mother_id ?? null,
    isSelf: Boolean(p.is_self),
  }));
  const selfId =
    sync.self_id ??
    persons.find((p) => p.isSelf)?.id ??
    (persons.length ? persons[0]!.id : null);
  return {
    version: 1,
    selfId,
    persons,
    updatedAt: parseRemoteUpdatedMs(sync.updated_at) || Date.now(),
  };
}

function localToRemotePayload(tree: LocalFamilyTree) {
  return {
    self_id: tree.selfId,
    persons: tree.persons.map((p) => ({
      id: p.id,
      name_kk: p.name,
      gender: p.gender,
      birth_year: p.birthYear ?? null,
      death_year: p.deathYear ?? null,
      clan_slug: p.clanSlug ?? null,
      notes_kk: p.notes ?? null,
      father_id: p.fatherId ?? null,
      mother_id: p.motherId ?? null,
      is_self: p.id === tree.selfId,
    })),
  };
}

function treeHasData(tree: LocalFamilyTree): boolean {
  return tree.persons.length > 0 && !!tree.selfId;
}

export async function pushFamilyTreeToServerIfLoggedIn(tree?: LocalFamilyTree): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const access = await getValidAccessToken();
  if (!access) return;
  const local = tree ?? (await loadFamilyTree());
  if (!treeHasData(local)) return;
  await putMeFamilyTree(base, access, localToRemotePayload(local));
}

export async function syncFamilyTreeWithServerBidirectional(): Promise<LocalFamilyTree> {
  const local = await loadFamilyTree();
  const base = getRaqatApiBase();
  if (!base) return local;
  const access = await getValidAccessToken();
  if (!access) return local;

  const r = await fetchMeFamilyTree(base, access);
  if (!r.ok || r.status === 401) return local;

  const remote = r.sync;
  const remotePersons = remote?.persons ?? [];
  const remoteMs = parseRemoteUpdatedMs(remote?.updated_at);

  if (remotePersons.length === 0 && treeHasData(local)) {
    await putMeFamilyTree(base, access, localToRemotePayload(local));
    return local;
  }

  if (remotePersons.length === 0) return local;

  if (!treeHasData(local)) {
    const imported = remoteToLocal(remote!);
    await saveFamilyTree(imported);
    return imported;
  }

  if (remoteMs > local.updatedAt) {
    const imported = remoteToLocal(remote!);
    await saveFamilyTree(imported);
    return imported;
  }

  if (local.updatedAt > remoteMs) {
    await putMeFamilyTree(base, access, localToRemotePayload(local));
  }

  return local;
}

export async function pullFamilyTreeFromServer(): Promise<LocalFamilyTree> {
  const base = getRaqatApiBase();
  if (!base) return emptyFamilyTree();
  const access = await getValidAccessToken();
  if (!access) return emptyFamilyTree();
  const r = await fetchMeFamilyTree(base, access);
  if (!r.ok || !r.sync?.persons?.length) return emptyFamilyTree();
  const imported = remoteToLocal(r.sync);
  await saveFamilyTree(imported);
  return imported;
}
