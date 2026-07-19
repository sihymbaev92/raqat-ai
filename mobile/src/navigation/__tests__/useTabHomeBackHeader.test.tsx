import React from "react";
import renderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { ThemeContext } from "../../theme/ThemeContext";
import type { ThemeColors } from "../../theme/colors";

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
  it("is hidden under screen restriction", () => {
    const navigation = { canGoBack: () => true, goBack: jest.fn() };
    let tree: ReactTestRenderer | undefined;
    act(() => {
      tree = renderWithTheme(
        <TabHomeBackButton navigation={navigation as never} colors={{ text: "#111" } as never} />
      );
    });
    expect(tree!.toJSON()).toBeNull();
  });
});
