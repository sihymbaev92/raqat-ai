import {
  APP_IS_OFFICIAL_KMDB_APP,
  COMMUNITY_DUA_PUBLIC_POSTING_ENABLED,
  PRIVACY_POLICY_URL,
} from "../../content/appTransparency";
import { IMAM_AI_BRAND_KK, kk } from "../kk";

describe("transparency / independence (KNB–QMDb posture)", () => {
  it("declares the app is not an official QMDb product", () => {
    expect(APP_IS_OFFICIAL_KMDB_APP).toBe(false);
    expect(IMAM_AI_BRAND_KK).not.toMatch(/ҚМДБ|КМДБ|QMDB|KMDB/i);
    expect(kk.transparency.independenceShort).toMatch(/тәуелсіз/i);
    expect(kk.transparency.independenceShort).toMatch(/ресми қолданбасы емес/i);
    expect(kk.transparency.independenceFull).toMatch(/пәтуа/i);
    expect(kk.prayer.sourceCalc).not.toMatch(/ҚМДБ ресми/i);
    expect(kk.prayer.sourceMethodHint).toMatch(/ресми қолданба белгісі емес/i);
  });

  it("keeps unmoderated community posting off and privacy URL public", () => {
    expect(COMMUNITY_DUA_PUBLIC_POSTING_ENABLED).toBe(false);
    expect(PRIVACY_POLICY_URL).toMatch(/^https:\/\/rahatomir\.com\/privacy\/?$/);
    expect(kk.communityDua.postingDisabled.length).toBeGreaterThan(20);
  });

  it("exposes settings transparency copy", () => {
    expect(kk.settings.sectionTransparency).toBeTruthy();
    expect(kk.settings.transparencyUsageAnalyticsSub).toMatch(/api\.rahatomir\.com/i);
    expect(kk.namazGuide.scholarReviewBanner).toMatch(/ҚМДБ ресми қолданбасы емес/);
  });
});
