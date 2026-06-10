import {
  qcf4AyahMarkerHeight,
  qcf4AyahMarkerTextColor,
  qcf4AyahMarkerTextColorForPage,
} from "../mushafAyahMarkerStyle";

describe("mushafAyahMarkerStyle", () => {
  it("keeps QCF4 ayah number marker slightly larger inside the line slot", () => {
    expect(qcf4AyahMarkerHeight(34, 36)).toBe(30);
    expect(qcf4AyahMarkerHeight(42, 44)).toBe(36);
  });

  it("uses black marker numbers on a light page", () => {
    expect(qcf4AyahMarkerTextColor(false)).toBe("#111111");
  });

  it("uses white marker numbers on a dark page", () => {
    expect(qcf4AyahMarkerTextColor(true)).toBe("#FFFFFF");
  });

  it("uses the Quran reading page color when app theme is still light", () => {
    expect(qcf4AyahMarkerTextColorForPage(false, "#121212")).toBe("#FFFFFF");
    expect(qcf4AyahMarkerTextColorForPage(false, "#FEF9F3")).toBe("#111111");
  });
});
