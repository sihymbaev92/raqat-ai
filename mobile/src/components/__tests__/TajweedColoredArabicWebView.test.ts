import { Platform } from "react-native";
import { tajweedHtmlWebViewSupported } from "../TajweedColoredArabicWebView";
import { inlineTajweedSpanStyle } from "../TajweedColoredArabicText";

jest.mock("react-native-webview", () => ({
  WebView: "WebView",
}));

describe("tajweedHtmlWebViewSupported", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: originalOS });
  });

  it("is true on android and ios", () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    expect(tajweedHtmlWebViewSupported()).toBe(true);
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    expect(tajweedHtmlWebViewSupported()).toBe(true);
  });

  it("is false on web", () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
    expect(tajweedHtmlWebViewSupported()).toBe(false);
  });
});

describe("inlineTajweedSpanStyle", () => {
  it("clears flex/width constraints and applies color without horizontal padding", () => {
    const style = inlineTajweedSpanStyle(
      { fontSize: 24, width: 200, flexGrow: 1, color: "#000" },
      "#DD0008"
    );
    expect(style.width).toBeUndefined();
    expect(style.flexGrow).toBeUndefined();
    expect(style.paddingHorizontal).toBe(0);
    expect(style.color).toBe("#DD0008");
    expect(style.writingDirection).toBe("rtl");
  });
});
