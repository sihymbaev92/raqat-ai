import subprocess
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/screens/HalalScreen.tsx"
text = subprocess.check_output(
    ["git", "show", "4b2ff00:mobile/src/screens/HalalScreen.tsx"],
    cwd=p.parents[2],
).decode("utf-8")

import_block = 'import { HalalProductsApiBanner } from "../components/halal/HalalProductsApiBanner";'
text = text.replace(
    import_block,
    import_block + '\nimport { HalalMapTabPanel } from "../components/halal/HalalMapTabPanel";',
    1,
)

text = text.replace(
    """  const onMainTabChange = useCallback((tab: HalalHubMainTab) => {
    setMainTab(tab);
    if (tab === "map") {
      setMapOpen(true);
    } else {
      setMapOpen(false);
    }
  }, []);""",
    """  const onMainTabChange = useCallback((tab: HalalHubMainTab) => {
    setMainTab(tab);
    if (tab !== "map") {
      setMapOpen(false);
    }
  }, []);""",
    1,
)

text = text.replace(
    """      <HubScreenHero
        variant="halal"
        title={kk.features.halalTitle}
        image={menuIconAssets.tileHalal}
        colors={colors}
        isDark={isDark}
        eyebrow="halaldamu.kz"
        compact
        tags={[kk.features.halalHeroTagRegistry, kk.features.halalHeroTagVerify]}
      />

      <HalalSegmentedTabs
        tabs={[
          { id: "institutions" as const, label: kk.features.halalTabInstitutions },
          { id: "verify" as const, label: kk.features.halalTabVerify },
          { id: "map" as const, label: kk.features.halalTabMap },
        ]}
        value={mainTab}
        onChange={onMainTabChange}
        colors={colors}
      />""",
    """      <HalalSegmentedTabs
        tabs={[
          { id: "institutions" as const, label: kk.features.halalTabInstitutions },
          { id: "verify" as const, label: kk.features.halalTabVerify },
          { id: "map" as const, label: kk.features.halalTabMap },
        ]}
        value={mainTab}
        onChange={onMainTabChange}
        colors={colors}
      />

      <HubScreenHero
        variant="halal"
        title={kk.features.halalTitle}
        image={menuIconAssets.tileHalal}
        colors={colors}
        isDark={isDark}
        eyebrow="halaldamu.kz"
        compact
        tags={[kk.features.halalHeroTagRegistry, kk.features.halalHeroTagVerify]}
      />""",
    1,
)

text = text.replace(
    ') : mainTab === "map" ? null : (',
    ') : mainTab === "map" ? (\n        <HalalMapTabPanel\n          colors={colors}\n          companyCount={catalogMeta?.totalItems ?? catalogItems.length}\n          onOpenMap={() => setMapOpen(true)}\n        />\n      ) : (',
    1,
)

assert "жоқ" in text
assert "HalalMapTabPanel" in text
p.write_text(text, encoding="utf-8", newline="\n")
print("ok")
