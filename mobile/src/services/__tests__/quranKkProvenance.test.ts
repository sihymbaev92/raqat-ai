import {
  formatQuranKkAttributionFooter,
  parseQuranKkBundleMeta,
  setQuranKkProvenanceFromBundle,
} from "../quranKkProvenance";
import { QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT } from "../../config/quranKkTranslation";

describe("quranKkProvenance", () => {
  it("formats footer from bundled metadata (Halifa Altai / qurankarim)", () => {
    const line = formatQuranKkAttributionFooter({
      attribution_kk: "asyldin.kz — (Транскрипция) Құранның қазақша жазылуы",
      source_detail:
        "https://asyldin.kz/library/readBook/id/29/ | gaps: Uthmani→quran_translit.py | text_kk gaps: qurankarim.kz API (Халифа Алтай)",
    });
    expect(line).toMatch(/qurankarim\.kz API \(Халифа Алтай\)/);
    expect(line).toMatch(/asyldin\.kz/);
    expect(line).not.toMatch(/Ерлан Алимулы/);
  });

  it("parses bundle meta into display object", () => {
    const p = parseQuranKkBundleMeta({
      attribution_kk: QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.attributionKk,
      source_detail: QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.sourceDetail,
      exported_at: QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.exportedAt,
    });
    expect(p.footerLine).toMatch(/Халифа Алтай/);
    expect(p.meaningLabelKk).toMatch(/Халифа|qurankarim/i);
  });

  it("caches provenance from bundle load", () => {
    const p = setQuranKkProvenanceFromBundle({
      source_detail: "text_kk gaps: qurankarim.kz API (Халифа Алтай)",
    });
    expect(p.footerLine).toMatch(/Халифа Алтай/);
  });
});
