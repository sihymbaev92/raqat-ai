import { useEffect, useState } from "react";
import { ensureGreatWordsCatalogLoaded } from "./greatWordsCatalog";

export function useGreatWordsCatalogReady(): {
  ready: boolean;
  loading: boolean;
  failed: boolean;
} {
  const [state, setState] = useState(() => ({
    ready: false,
    loading: true,
    failed: false,
  }));

  useEffect(() => {
    let cancelled = false;
    void ensureGreatWordsCatalogLoaded().then((catalog) => {
      if (cancelled) return;
      const ok = Boolean(catalog?.entries?.length);
      setState({ ready: ok, loading: false, failed: !ok });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
