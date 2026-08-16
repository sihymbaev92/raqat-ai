import {
  computeHatimQcf4EquivalentTextMetrics,
  computeHatimQcf4LinesAreaH,
} from "../mushafQcf4Layout";

describe("computeHatimQcf4LinesAreaH", () => {
  it("subtracts chrome and surah frame reserves like MushafBookPageQcf4", () => {
    expect(
      computeHatimQcf4LinesAreaH({
        pageHeight: 720,
        qcomPurePage: true,
        useExternalSurahFrame: true,
        isPhoneQcf4Page: true,
      })
    ).toBe(720 - 28 - 56 - 14 * 2);
  });

  it("turkish hatim uses page chrome height and tight vertical safe", () => {
    expect(
      computeHatimQcf4LinesAreaH({
        pageHeight: 720,
        qcomPurePage: true,
        useExternalSurahFrame: false,
        isPhoneQcf4Page: true,
        unicodeTurkishHatim: true,
      })
    ).toBe(720 - 30 - 2 * 2);
  });
});

describe("computeHatimQcf4EquivalentTextMetrics", () => {
  it("derives font size from viewport line area (Medina QCF4 parity)", () => {
    const linesAreaH = computeHatimQcf4LinesAreaH({
      pageHeight: 720,
      qcomPurePage: true,
      useExternalSurahFrame: false,
      isPhoneQcf4Page: true,
    });
    const { fontSize, lineHeight } = computeHatimQcf4EquivalentTextMetrics({
      linesAreaH,
      mushafTextScale: 1.04,
      isPhoneQcf4Page: true,
      qcomPurePage: true,
    });
    expect(fontSize).toBeGreaterThanOrEqual(18);
    expect(lineHeight).toBeGreaterThanOrEqual(fontSize);
  });

  it("turkish unicode uses tighter line-height than Medina QCF4 glyphs", () => {
    const linesAreaH = computeHatimQcf4LinesAreaH({
      pageHeight: 720,
      qcomPurePage: true,
      useExternalSurahFrame: false,
      isPhoneQcf4Page: true,
    });
    const madinah = computeHatimQcf4EquivalentTextMetrics({
      linesAreaH,
      mushafTextScale: 1.04,
      isPhoneQcf4Page: true,
      qcomPurePage: true,
    });
    const turkish = computeHatimQcf4EquivalentTextMetrics({
      linesAreaH,
      mushafTextScale: 1.04,
      isPhoneQcf4Page: true,
      qcomPurePage: true,
      unicodeTurkishPrint: true,
    });
    expect(turkish.fontSize).toBe(madinah.fontSize - 1);
    expect(turkish.lineHeight).toBeLessThan(madinah.lineHeight);
    expect(turkish.lineHeight).toBe(Math.ceil(turkish.fontSize * 1.42));
  });
});
