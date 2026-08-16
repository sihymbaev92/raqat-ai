import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  ensureHatimBookFontsLoaded,
  isQuranBookFontsReady,
} from "../fonts/quranBookFonts";
import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";

/** Түрік Unicode: Scheherazade/Lateef дайын болғанша стиль fallback. */
export function useTurkishPrintFontsReady(
  arabicScriptEdition: QuranArabicScriptEditionId
): boolean {
  const turkish = arabicScriptEdition === "turkish";
  const [ready, setReady] = useState(() => !turkish || Platform.OS === "web");

  useEffect(() => {
    if (!turkish || Platform.OS === "web") {
      setReady(true);
      return;
    }
    let alive = true;
    void (async () => {
      if (await isQuranBookFontsReady()) {
        if (alive) setReady(true);
        return;
      }
      const loaded = await ensureHatimBookFontsLoaded();
      if (alive) setReady(loaded);
    })();
    return () => {
      alive = false;
    };
  }, [turkish]);

  return ready;
}
