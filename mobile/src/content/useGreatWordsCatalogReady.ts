import { useEffect, useState } from "react";
import { ensureGreatWordsCatalogLoaded, isGreatWordsCatalogReady } from "./greatWordsCatalog";

export function useGreatWordsCatalogReady(): {
  ready: boolean;
  loading: boolean;
  failed: boolean;
} {
  const [state, setState] = useState(() => {
    const ready = isGreatWordsCatalogReady();
    return { ready, loading: !ready, failed: false };
  });

  useEffect(() => {
    if (state.ready) return;
    let cancelled = false;
    void ensureGreatWordsCatalogLoaded().then((catalog) => {
      if (cancelled) return;
      const ok = Boolean(catalog?.entries?.length);
      setState({ ready: ok, loading: false, failed: !ok });
    });
    return () => {
      cancelled = true;
    };
  }, [state.ready]);

  return state;
}
