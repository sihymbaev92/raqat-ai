import { popMoreStackScreen } from "../useMoreStackHardwareBack";
import { rootNavigationRef } from "../rootNavigationRef";

describe("popMoreStackScreen", () => {
  it("pops inner stack when history exists", () => {
    const goBack = jest.fn();
    const navigation = {
      canGoBack: () => true,
      goBack,
    };
    expect(popMoreStackScreen(navigation as never)).toBe(true);
    expect(goBack).toHaveBeenCalled();
  });

  it("exits MoreStack from root when inner stack cannot pop", () => {
    const rootGoBack = jest.fn();
    jest.spyOn(rootNavigationRef, "isReady").mockReturnValue(true);
    jest.spyOn(rootNavigationRef, "getRootState").mockReturnValue({
      index: 1,
      routes: [{ name: "Main" }, { name: "MoreStack" }],
    } as never);
    jest.spyOn(rootNavigationRef, "canGoBack").mockReturnValue(true);
    jest.spyOn(rootNavigationRef, "goBack").mockImplementation(rootGoBack);

    const navigation = {
      canGoBack: () => false,
      goBack: jest.fn(),
    };
    expect(popMoreStackScreen(navigation as never)).toBe(true);
    expect(rootGoBack).toHaveBeenCalled();
  });

  it("runs beforePop before navigating away", () => {
    const beforePop = jest.fn(() => true);
    const navigation = {
      canGoBack: () => true,
      goBack: jest.fn(),
    };
    expect(popMoreStackScreen(navigation as never, { beforePop })).toBe(true);
    expect(beforePop).toHaveBeenCalled();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
