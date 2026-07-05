import { useCallback, useState } from "react";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getValidAccessToken } from "../storage/authTokens";
import { getOrCreateClientId } from "../storage/clientId";
import {
  fetchCommunityDuas,
  postCommunityDuaAmen,
  type CommunityDuaRow,
} from "../services/platformApiClient";

export function useCommunityDuas(limit = 35) {
  const [rows, setRows] = useState<CommunityDuaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const base = getRaqatApiBase();
    if (!base) {
      setRows([]);
      setError("api_missing");
      return { latest: null as CommunityDuaRow | null };
    }
    setLoading(true);
    try {
      const bearer = (await getValidAccessToken())?.trim() ?? undefined;
      const j = await fetchCommunityDuas(base, { limit, authorizationBearer: bearer, timeoutMs: 22_000 });
      if (j?.ok && Array.isArray(j.duas)) {
        setRows(j.duas);
        setError(null);
        return { latest: j.duas[0] ?? null };
      }
      setRows(Array.isArray(j.duas) ? j.duas : []);
      setError(typeof j.detail === "string" ? j.detail : "load_failed");
      return { latest: j.duas?.[0] ?? null };
    } catch {
      setRows([]);
      setError("network");
      return { latest: null as CommunityDuaRow | null };
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const amen = useCallback(async (duaId: number) => {
    const base = getRaqatApiBase();
    const cid = await getOrCreateClientId();
    if (!base || !cid) return null;
    const bearer = (await getValidAccessToken())?.trim() ?? undefined;
    const r = await postCommunityDuaAmen(base, duaId, cid, { authorizationBearer: bearer });
    if (r.ok && typeof r.amen_count === "number") {
      setRows((prev) =>
        prev.map((row) => (row.id === duaId ? { ...row, amen_count: r.amen_count as number } : row))
      );
      return r.amen_count;
    }
    return null;
  }, []);

  return { rows, loading, error, load, amen, setRows };
}
