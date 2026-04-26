import type { NavigationState } from "@react-navigation/native";
import {
  deriveGlobalVoiceEntryLayout,
  shouldRunQiblaMotionSensors,
} from "../deriveGlobalVoiceEntry";

/** Тест үшін толық Nav типін толтырудың қажеті жоқ */
function mockRootState(mainTabIndex: number): NavigationState {
  return {
    key: "root",
    type: "stack",
    stale: false as const,
    index: 0,
    routeNames: ["Main"],
    routes: [
      {
        key: "Main-x",
        name: "Main",
        state: {
          key: "tabs",
          type: "tab",
          stale: false as const,
          index: mainTabIndex,
          routeNames: ["Home", "Duas", "Tasbih"],
          routes: [
            { key: "Home", name: "Home" },
            { key: "Duas", name: "Duas" },
            { key: "Tasbih", name: "Tasbih" },
          ],
        },
      },
    ],
  } as unknown as NavigationState;
}

function mockQiblaActive(): NavigationState {
  return {
    key: "root",
    type: "stack",
    stale: false as const,
    index: 0,
    routeNames: ["Main", "Qibla"],
    routes: [{ key: "Qibla-x", name: "Qibla" }],
  } as unknown as NavigationState;
}

describe("deriveGlobalVoiceEntryLayout", () => {
  it("rootReady=false → FAB жасырылады", () => {
    const l = deriveGlobalVoiceEntryLayout(undefined, false);
    expect(l).toEqual({ showGlobalFab: false, bottomInset: 16 });
  });

  it("rootReady=true, state жоқ → FAB көрінеді", () => {
    const l = deriveGlobalVoiceEntryLayout(undefined, true);
    expect(l).toEqual({ showGlobalFab: true, bottomInset: 16 });
  });

  it("Main → Home → FAB жоқ, bottomInset 0", () => {
    const s = mockRootState(0);
    const l = deriveGlobalVoiceEntryLayout(s, true);
    expect(l).toEqual({ showGlobalFab: false, bottomInset: 0 });
  });

  it("Main → Duas → FAB бар, standard inset", () => {
    const s = mockRootState(1);
    const l = deriveGlobalVoiceEntryLayout(s, true);
    expect(l).toEqual({ showGlobalFab: true, bottomInset: 16 });
  });

  it("Құбыла толық экран → FAB бар", () => {
    const s = mockQiblaActive();
    const l = deriveGlobalVoiceEntryLayout(s, true);
    expect(l).toEqual({ showGlobalFab: true, bottomInset: 16 });
  });

  it("useSyncExternalStore тұзақсыз: бірдей кіріс → бірдей нәтиже (мән салыстыру)", () => {
    const s = mockRootState(0);
    const a = deriveGlobalVoiceEntryLayout(s, true);
    const b = deriveGlobalVoiceEntryLayout(s, true);
    expect(a).toEqual(b);
    expect(a.showGlobalFab).toBe(b.showGlobalFab);
    expect(a.bottomInset).toBe(b.bottomInset);
  });
});

describe("shouldRunQiblaMotionSensors", () => {
  it("нави дайын емес → false", () => {
    expect(shouldRunQiblaMotionSensors(undefined, false)).toBe(false);
  });

  it("state жоқ (түбір әлі жоқ) → false", () => {
    expect(shouldRunQiblaMotionSensors(undefined, true)).toBe(false);
  });

  it("Main Home → true", () => {
    expect(shouldRunQiblaMotionSensors(mockRootState(0), true)).toBe(true);
  });

  it("Main Duas → false", () => {
    expect(shouldRunQiblaMotionSensors(mockRootState(1), true)).toBe(false);
  });

  it("Qibla экраны → true", () => {
    expect(shouldRunQiblaMotionSensors(mockQiblaActive(), true)).toBe(true);
  });
});
