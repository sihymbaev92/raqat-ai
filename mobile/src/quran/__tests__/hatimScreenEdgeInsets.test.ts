import {
  HATIM_AYAH_EDGE_BLEED_PX,
  HATIM_MARKER_END_RESERVE,
  hatimAyahBlockPaddingForQcomAyahPage,
  hatimAyahBlockPaddingForScreen,
  hatimAyahEdgePaddingTight,
  hatimHorizontalScreenReserve,
} from "../hatimScreenEdgeInsets";
import { hatimDisplayMarginProfile } from "../hatimDisplayProfile";

describe("hatimScreenEdgeInsets", () => {
  it("reserves min 1.4% screen width per side on phone", () => {
    const r = hatimHorizontalScreenReserve(390);
    expect(r.left).toBeGreaterThanOrEqual(6);
    expect(r.right).toBeGreaterThanOrEqual(6);
  });

  it("uses safe area insets when larger than min percent", () => {
    const r = hatimHorizontalScreenReserve(390, { left: 28, right: 0 });
    expect(r.left).toBe(28);
    expect(r.right).toBeGreaterThanOrEqual(6);
  });

  it("tight padding keeps marker reserve on left only", () => {
    const pad = hatimAyahEdgePaddingTight(390, { left: 0, right: 0 });
    const minSide = Math.max(5, Math.ceil(390 * 0.014));
    expect(pad.paddingRight).toBe(HATIM_AYAH_EDGE_BLEED_PX + minSide);
    expect(pad.paddingLeft).toBe(HATIM_AYAH_EDGE_BLEED_PX + minSide + HATIM_MARKER_END_RESERVE);
  });

  it("adds reduced profile extras for RAQAT chrome theme", () => {
    const profile = hatimDisplayMarginProfile(412, 892);
    const pad = hatimAyahBlockPaddingForScreen(profile, 412, { left: 0, right: 0 });
    const tight = hatimAyahEdgePaddingTight(412, { left: 0, right: 0 });
    expect(pad.paddingLeft).toBe(
      tight.paddingLeft + Math.round(profile.ayahLineEndExtra * 0.35)
    );
    expect(pad.paddingRight).toBe(
      tight.paddingRight + Math.round(profile.ayahEdgeInset * 0.3)
    );
  });

  it("qcom Ayah page uses tight edge padding", () => {
    const pad = hatimAyahBlockPaddingForQcomAyahPage(390, { left: 0, right: 0 });
    const minSide = Math.max(5, Math.ceil(390 * 0.014));
    expect(pad.paddingRight).toBe(HATIM_AYAH_EDGE_BLEED_PX + minSide);
    expect(pad.paddingLeft).toBeGreaterThan(pad.paddingRight);
  });
});
