import { hatimPageIdleShellStyle, hatimPageTurnTopAnimatedStyle } from "../hatimPageCurlTransform";
import { Animated } from "react-native";

describe("hatimPageCurlTransform", () => {
  it("resets idle shell to full width centered", () => {
    expect(hatimPageIdleShellStyle(360)).toEqual({
      width: 360,
      alignSelf: "center",
      overflow: "visible",
      opacity: 1,
    });
  });

  it("uses fade+slide without width clip", () => {
    const progress = new Animated.Value(0);
    const style = hatimPageTurnTopAnimatedStyle(progress, "forward", 360);
    expect(style.width).toBe(360);
    expect(style.alignSelf).toBe("center");
    expect(style.opacity).toBeTruthy();
    expect(style.transform).toBeTruthy();
  });
});
