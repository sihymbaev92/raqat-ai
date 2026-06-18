import React from "react";
import { StyleSheet, type TextStyle } from "react-native";
import { MushafSurahHeader, type MushafSurahHeaderStyles } from "../MushafSurahHeader";
import { QURAN_BASMALA_READER_AR } from "../../../constants/quranUthmani";
import type { ThemeColors } from "../../../theme/colors";
import { surahArabicBannerTitle } from "../../../data/surahArabicTitles";

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

type HeaderProps = {
  accessibilityRole?: string;
  adjustsFontSizeToFit?: boolean;
  allowFontScaling?: boolean;
  minimumFontScale?: number;
  style?: unknown;
  children?: React.ReactNode;
};

function findHeaderProps(node: unknown): HeaderProps | null {
  if (!React.isValidElement(node)) return null;
  const props = node.props as HeaderProps;
  if (props.accessibilityRole === "header") {
    return props;
  }
  for (const child of React.Children.toArray(props.children)) {
    const found = findHeaderProps(child);
    if (found) return found;
  }
  return null;
}

function findHeaderStyle(node: unknown): TextStyle | null {
  const props = findHeaderProps(node);
  return props ? (StyleSheet.flatten(props.style) as TextStyle) : null;
}

function findFrameStyle(node: unknown): Record<string, unknown> | null {
  if (!React.isValidElement(node)) return null;
  const props = node.props as { style?: unknown; children?: React.ReactNode };
  const style = StyleSheet.flatten(props.style) as Record<string, unknown> | undefined;
  if (style?.height === 44 && style?.maxWidth === 340) {
    return style;
  }
  for (const child of React.Children.toArray(props.children)) {
    const found = findFrameStyle(child);
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

  it("keeps all 114 surah names in the exact same Ikhlas-style header typography", () => {
    for (let surah = 1; surah <= 114; surah += 1) {
      const tree = MushafSurahHeader({
        colors,
        mushafLayout: true,
        qcomBookLayout: true,
        qcf4LineSlotLayout: true,
        surahArabicTitleLine: surahArabicBannerTitle(surah),
        showMushafBismillahBanner: false,
        styles,
      });

      const props = findHeaderProps(tree);
      const style = props ? (StyleSheet.flatten(props.style) as TextStyle) : null;
      const frameStyle = findFrameStyle(tree);
      expect(textContent(tree)).toContain(surahArabicBannerTitle(surah));
      expect(frameStyle?.width).toBe("86%");
      expect(frameStyle?.maxWidth).toBe(340);
      expect(frameStyle?.height).toBe(44);
      expect(style?.fontSize).toBe(20);
      expect(style?.lineHeight).toBe(29);
      expect(style?.fontWeight).toBe("600");
      expect(props?.adjustsFontSizeToFit).toBe(false);
      expect(props?.minimumFontScale).toBe(1);
      expect(props?.allowFontScaling).toBe(false);
    }
  });
});
