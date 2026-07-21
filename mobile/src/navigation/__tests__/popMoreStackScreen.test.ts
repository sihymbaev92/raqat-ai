import { popMoreStackScreen } from "../useMoreStackHardwareBack";

describe("popMoreStackScreen", () => {
  it("pops inner stack when history exists", () => {
    const goBack = jest.fn();
    const navigation = {
      getState: () => ({ index: 2, routes: [{}, {}, {}] }),
      goBack,
    };
    expect(popMoreStackScreen(navigation as never)).toBe(true);
    expect(goBack).toHaveBeenCalled();
  });

  it("returns false when inner stack cannot pop", () => {
    const navigation = {
      getState: () => ({ index: 0, routes: [{}] }),
      goBack: jest.fn(),
    };
    expect(popMoreStackScreen(navigation as never)).toBe(false);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it("returns false when navigator is unfocused (stale after remount)", () => {
    const navigation = {
      getState: () => ({ index: 2, routes: [{}, {}, {}] }),
      goBack: jest.fn(),
      isFocused: () => false,
      canGoBack: () => true,
    };
    expect(popMoreStackScreen(navigation as never)).toBe(false);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it("returns false when canGoBack is false", () => {
    const navigation = {
      getState: () => ({ index: 2, routes: [{}, {}, {}] }),
      goBack: jest.fn(),
      isFocused: () => true,
      canGoBack: () => false,
    };
    expect(popMoreStackScreen(navigation as never)).toBe(false);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
