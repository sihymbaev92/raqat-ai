import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../config/officialIslamicSources";
import { halalDamuSiteHomeUrl } from "../api/halalDamuWp";

let moreStackWarm: Promise<void> | null = null;
let kmdbWarm: Promise<void> | null = null;
let halalWarm: Promise<void> | null = null;

function warmMoreStack(): Promise<void> {
  if (!moreStackWarm) {
    moreStackWarm = import("../navigation/MoreStack").then(() => undefined);
  }
  return moreStackWarm;
}

/** Dashboard «ҚМДБ» батырмасын basу алдында — chunk + muftyat/fatua DNS/TLS. */
export function warmKmdbHubScreen(): void {
  if (kmdbWarm) return;
  kmdbWarm = warmMoreStack()
    .then(() =>
      Promise.all([
        import("../screens/KmdbHubScreen"),
        import("../components/officialSiteWebViewReload").then((m) =>
          m.prefetchOfficialSiteWebPages([MUFTYAT_KK_HOME_URL, FATUA_KK_HOME_URL])
        ),
      ])
    )
    .then(() => undefined)
    .catch(() => undefined);
}

/** Dashboard «Halal Damu» батырмасын basу алдында — chunk + bundled каталог + сайт warm-up. */
export function warmHalalHubScreen(): void {
  if (halalWarm) return;
  halalWarm = warmMoreStack()
    .then(() =>
      Promise.all([
        import("../screens/HalalScreen"),
        import("../services/halalHubBootstrap").then((m) => {
          m.getHalalHubInstantCatalog();
          void m.prefetchHalalDamuHub();
        }),
        import("../components/officialSiteWebViewReload").then((m) =>
          m.prefetchOfficialSiteWebPages([halalDamuSiteHomeUrl()])
        ),
      ])
    )
    .then(() => undefined)
    .catch(() => undefined);
}

/** Boot: екі хабты да алдын ала дайындау (dashboard ашылғаннан кейін). */
export function warmHotHubScreens(): void {
  warmKmdbHubScreen();
  warmHalalHubScreen();
}
