import React from "react";
import renderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { ThemeContext } from "../../theme/ThemeContext";
import type { ThemeColors } from "../../theme/colors";

jest.mock("../../i18n/useI18n", () => ({
  useI18n: () => ({ common: { back: "Back" } }),
}));

jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement("Icon", props),
  };
});

import { TabHomeBackButton } from "../useTabHomeBackHeader";

const themeValue = {
  colors: { text: "#111", muted: "#888" } as ThemeColors,
  themeScheme: "light" as const,
  colorPalette: "violet" as const,
  isDark: false,
  setThemeScheme: () => {},
  setColorPalette: () => {},
};

function renderWithTheme(element: React.ReactElement) {
  return renderer.create(
    <ThemeContext.Provider value={themeValue}>{element}</ThemeContext.Provider>
  );
}

describe("TabHomeBackButton", () => {
  it("returns null when navigation cannot go back", () => {
    const navigation = { canGoBack: () => false, goBack: jest.fn() };
    let tree: ReactTestRenderer | undefined;
    act(() => {
      tree = renderWithTheme(
        <TabHomeBackButton navigation={navigation as never} colors={{ text: "#111" } as never} />
      );
    });
    expect(tree!.toJSON()).toBeNull();
  });

  it("returns a pressable when navigation can go back", () => {
    const navigation = { canGoBack: () => true, goBack: jest.fn() };
    let tree: ReactTestRenderer | undefined;
    act(() => {
      tree = renderWithTheme(
        <TabHomeBackButton navigation={navigation as never} colors={{ text: "#111" } as never} />
      );
    });
    const root = tree!.root;
    expect(root.findByProps({ accessibilityRole: "button" }).props.accessibilityLabel).toBe("Back");
  });
});
