import { NAMAZ_WUDU_VISUAL_STEPS } from "../namazWuduSteps";
import { NAMAZ_POSE_VISUAL_STEPS, NAMAZ_PRAYER_TYPE_CARDS } from "../namazPrayerGuideContent";
import {
  FIVE_PRAYER_END_RECITATIONS,
  ISTIKHARAH_DUA,
  JANAZAH_DUA,
  MOSQUE_ENTER_DUA,
  MOSQUE_EXIT_DUA,
  SALAWAT_IBRAHIMIYYA,
  SALAWAT_SHORT_BLOCK,
  TAWBA_AFTER_DUA,
  WITR_QUNUT_DUA,
} from "../namazSpecialPrayerDuas";
import {
  getNamazRecitationBlocksForGuidePose,
  NAMAZ_WUDU_LEARNING_MODULES,
  type RecitationBlock,
} from "../namazLearningContent";

function collectRecitationBlocks(): RecitationBlock[] {
  const out: RecitationBlock[] = [
    ...FIVE_PRAYER_END_RECITATIONS,
    ISTIKHARAH_DUA,
    JANAZAH_DUA,
    MOSQUE_ENTER_DUA,
    MOSQUE_EXIT_DUA,
    SALAWAT_IBRAHIMIYYA,
    SALAWAT_SHORT_BLOCK,
    TAWBA_AFTER_DUA,
    WITR_QUNUT_DUA,
  ];
  for (const card of NAMAZ_PRAYER_TYPE_CARDS) {
    if (card.recitations?.length) out.push(...card.recitations);
  }
  for (const step of NAMAZ_WUDU_VISUAL_STEPS) {
    if (step.recitations?.length) out.push(...step.recitations);
  }
  for (const pose of NAMAZ_POSE_VISUAL_STEPS) {
    out.push(...getNamazRecitationBlocksForGuidePose(pose.title));
  }
  for (const mod of NAMAZ_WUDU_LEARNING_MODULES) {
    for (const step of mod.steps) {
      out.push(...step.recitations);
    }
  }
  return out;
}

describe("namaz recitation blocks", () => {
  it("every block has id, label, arabic, and meaningKk for UI render", () => {
    const blocks = collectRecitationBlocks();
    expect(blocks.length).toBeGreaterThan(10);
    const seen = new Set<string>();
    for (const b of blocks) {
      expect(b.id).toBeTruthy();
      seen.add(b.id);
      expect(b.label.trim().length).toBeGreaterThan(0);
      expect(b.arabic.trim().length).toBeGreaterThan(0);
      expect(b.meaningKk.trim().length).toBeGreaterThan(0);
    }
    expect(seen.size).toBeGreaterThan(10);
  });
});
