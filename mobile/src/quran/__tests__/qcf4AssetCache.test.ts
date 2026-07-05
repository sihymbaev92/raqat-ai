import {
  qcf4FontCachePath,
  qcf4FontFileName,
  qcf4PageCachePath,
  qcf4RemoteFontUrls,
  qcf4RemotePageJsonUrls,
} from "../qcf4AssetCache";

jest.mock("react-native", () => ({ Platform: { OS: "android" } }));

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///mock/",
  downloadAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

describe("qcf4AssetCache paths", () => {
  it("builds page and font cache paths", () => {
    expect(qcf4PageCachePath(1)).toContain("001.json");
    expect(qcf4FontCachePath("QCF4_Hafs_01", "ttf")).toContain("QCF4_Hafs_01_W.ttf");
  });

  it("names BSML font files", () => {
    expect(qcf4FontFileName("QCF4_QBSML", "ttf")).toBe("QCF4_QBSML.ttf");
    expect(qcf4FontFileName("QCF4_QBSML", "woff2")).toBe("QCF4_QBSML.woff2");
  });

  it("lists CDN then upstream URLs", () => {
    const pages = qcf4RemotePageJsonUrls(42);
    expect(pages[0]).toContain("rahatomir.com");
    expect(pages[1]).toContain("githubusercontent.com");
    const fonts = qcf4RemoteFontUrls("QCF4_Hafs_02", "ttf");
    expect(fonts[0]).toContain("qcf4/fonts/QCF4_Hafs_02_W.ttf");
    expect(fonts[1]).toContain("fonts/QCF4_Hafs_02_W.ttf");
  });
});
