import { TabHomeBackButton } from "../useTabHomeBackHeader";

describe("TabHomeBackButton", () => {
  it("returns null when navigation cannot go back", () => {
    const navigation = { canGoBack: () => false, goBack: jest.fn() };
    const node = TabHomeBackButton({ navigation: navigation as never, colors: { text: "#111" } as never });
    expect(node).toBeNull();
  });

  it("returns a pressable when navigation can go back", () => {
    const navigation = { canGoBack: () => true, goBack: jest.fn() };
    const node = TabHomeBackButton({ navigation: navigation as never, colors: { text: "#111" } as never });
    expect(node).not.toBeNull();
    expect(node).toHaveProperty("props.accessibilityRole", "button");
  });
});
