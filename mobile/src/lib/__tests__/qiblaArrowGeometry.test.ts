import {
  QIBLA_NEEDLE_SPIN_OFFSET_DEG,
  QIBLA_ORNAMENT_ASSET_TIP_DEG,
  QIBLA_ORNAMENT_IMAGE_ALIGN_DEG,
  qiblaNeedleSpinDeg,
  qiblaNeedleTipScreenDeg,
  qiblaOrnamentSpinDeg,
} from "../qiblaArrowGeometry";

describe("qiblaArrowGeometry", () => {
  it("vector spin offset maps aligned rotateDeg to tip up (0° screen)", () => {
    expect(qiblaNeedleSpinDeg(0)).toBe(QIBLA_NEEDLE_SPIN_OFFSET_DEG);
    expect(qiblaNeedleTipScreenDeg(0)).toBe(0);
  });

  it("ornament align cancels asset tip before spin", () => {
    expect(QIBLA_ORNAMENT_IMAGE_ALIGN_DEG + QIBLA_ORNAMENT_ASSET_TIP_DEG).toBe(
      QIBLA_NEEDLE_SPIN_OFFSET_DEG
    );
  });

  it("tip screen azimuth follows rotateDeg", () => {
    expect(qiblaNeedleTipScreenDeg(90)).toBe(90);
    expect(qiblaNeedleTipScreenDeg(-90)).toBe(270);
  });

  it("ornament single spin: golden tip azimuth equals rotateDeg", () => {
    const net = (rotateDeg: number) =>
      (((QIBLA_ORNAMENT_ASSET_TIP_DEG + qiblaOrnamentSpinDeg(rotateDeg)) % 360) + 360) % 360;
    expect(net(0)).toBe(0);
    expect(net(45)).toBe(45);
    expect(net(120)).toBe(120);
    expect(qiblaOrnamentSpinDeg(0)).toBe(-QIBLA_ORNAMENT_ASSET_TIP_DEG);
  });
});
