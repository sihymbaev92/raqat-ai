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

  it("treats missing index as root", () => {
    const navigation = {
      getState: () => ({ routes: [{}] }),
      goBack: jest.fn(),
    };
    expect(popMoreStackScreen(navigation as never)).toBe(false);
  });
});
