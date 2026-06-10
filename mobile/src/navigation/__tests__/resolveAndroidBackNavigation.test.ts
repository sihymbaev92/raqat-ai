import { CommonActions } from "@react-navigation/native";
import { resolveAndroidBackNavigation } from "../resolveAndroidBackNavigation";

describe("resolveAndroidBackNavigation", () => {
  it("returns false when already on Home tab at root", () => {
    const dispatch = jest.fn();
    const ok = resolveAndroidBackNavigation(
      {
        key: "root",
        index: 0,
        routeNames: ["Main"],
        routes: [
          {
            key: "main",
            name: "Main",
            state: {
              key: "tabs",
              index: 0,
              routeNames: ["Home", "Duas", "Tasbih"],
              routes: [
                { key: "home", name: "Home" },
                { key: "duas", name: "Duas" },
                { key: "tasbih", name: "Tasbih" },
              ],
              type: "tab",
              stale: false,
            },
          },
        ],
        type: "stack",
        stale: false,
      },
      dispatch
    );
    expect(ok).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not jump to Home when another Main screen is focused", () => {
    const dispatch = jest.fn();
    const ok = resolveAndroidBackNavigation(
      {
        key: "root",
        index: 0,
        routeNames: ["Main"],
        routes: [
          {
            key: "main",
            name: "Main",
            state: {
              key: "tabs",
              index: 1,
              routeNames: ["Home", "Duas", "Tasbih"],
              routes: [
                { key: "home", name: "Home" },
                { key: "duas", name: "Duas" },
                { key: "tasbih", name: "Tasbih" },
              ],
              type: "tab",
              stale: false,
            },
          },
        ],
        type: "stack",
        stale: false,
      },
      dispatch
    );
    expect(ok).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("pops nested MoreStack when inner stack can go back", () => {
    const dispatch = jest.fn();
    const ok = resolveAndroidBackNavigation(
      {
        key: "root",
        index: 1,
        routeNames: ["Main", "MoreStack"],
        routes: [
          { key: "main", name: "Main" },
          {
            key: "more",
            name: "MoreStack",
            state: {
              key: "more-stack",
              index: 1,
              routeNames: ["ContentHub", "QuranList"],
              routes: [
                { key: "hub", name: "ContentHub" },
                { key: "ql", name: "QuranList" },
              ],
              type: "stack",
              stale: false,
            },
          },
        ],
        type: "stack",
        stale: false,
      },
      dispatch
    );
    expect(ok).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(CommonActions.goBack());
  });
});
