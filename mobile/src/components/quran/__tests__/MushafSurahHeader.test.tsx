import React from "react";
import { StyleSheet, type TextStyle } from "react-native";
import { MushafSurahHeader, type MushafSurahHeaderStyles } from "../MushafSurahHeader";
import { QURAN_BASMALA_READER_AR } from "../../../constants/quranUthmani";
import type { ThemeColors } from "../../../theme/colors";

const styles: MushafSurahHeaderStyles = {
  mushafSurahTitleBlock: {},
  mushafSurahTitlePaper: {},
  mushafSurahTitleAr: {},
  mushafAyahTxt: {},
  bismillahBanner: {},
  mushafBismillahBanner: {},
  bismillahBannerTxt: {},
  mushafBismillahBannerTxt: {},
};

const colors = {} as ThemeColors;

function textContent(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!React.isValidElement(node)) return "";
  const props = node.props as { children?: React.ReactNode };
  return React.Children.toArray(props.children)
    .map((child) => textContent(child))
    .join("");
}

function findHeaderStyle(node: unknown): TextStyle | null {
  if (!React.isValidElement(node)) return null;
  const props = node.props as { accessibilityRole?: string; style?: unknown; children?: React.ReactNode };
  if (props.accessibilityRole === "header") {
    return StyleSheet.flatten(props.style) as TextStyle;
  }
  for (const child of React.Children.toArray(props.children)) {
    const found = findHeaderStyle(child);
    if (found) return found;
  }
  return null;
}

describe("MushafSurahHeader", () => {
  it("renders the Bismillah banner when requested", () => {
    const tree = MushafSurahHeader({
      colors,
      mushafLayout: true,
      surahArabicTitleLine: null,
      showMushafBismillahBanner: true,
      styles,
    });

    expect(textContent(tree)).toContain(QURAN_BASMALA_READER_AR);
  });

  it.each([
    ["book", { bookPageLayout: true }],
    ["qcom", { qcomBookLayout: true }],
    ["qcf4", { qcomBookLayout: true, qcf4LineSlotLayout: true }],
  ])("uses the same Hatim surah title typography for %s layout", (_name, layout) => {
    const tree = MushafSurahHeader({
      colors,
      mushafLayout: true,
      surahArabicTitleLine: "ٱلْفَاتِحَةِ",
      showMushafBismillahBanner: false,
      styles,
      ...layout,
    });

    const style = findHeaderStyle(tree);
    expect(style?.fontSize).toBe(20);
    expect(style?.lineHeight).toBe(29);
    expect(style?.fontWeight).toBe("600");
  });
});
