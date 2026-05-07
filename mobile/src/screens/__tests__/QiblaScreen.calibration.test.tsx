import React from "react";
import { Text } from "react-native";
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";
import { QiblaScreen } from "../QiblaScreen";
import { kk } from "../../i18n/kk";

jest.mock("../../context/QiblaSensorContext", () => ({
  useQiblaSensor: jest.fn(),
}));

jest.mock("../../theme/ThemeContext", () => ({
  useAppTheme: () => ({
    colors: {
      bg: "#000",
      text: "#fff",
      muted: "#aaa",
      accent: "#0f0",
      border: "#333",
      card: "#111",
      success: "#0f0",
      error: "#f00",
    },
  }),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: () => undefined,
}));

jest.mock("../../components/QiblaArrowPointer", () => ({
  QiblaArrowPointer: () => null,
}));

jest.mock("../../theme/menuIconAssets", () => ({
  menuIconAssets: {
    headerQibla: 1,
  },
}));

const { useQiblaSensor } = jest.requireMock("../../context/QiblaSensorContext") as {
  useQiblaSensor: jest.Mock;
};

type SensorState = {
  perm: string;
  bearing: number | null;
  rotateDeg: number;
  refreshBearing: jest.Mock;
  positionFailed: boolean;
  locationSource: "gps" | "city";
  motionMode: "balanced" | "fast";
  setMotionMode: jest.Mock;
};

function readAllText(root: ReactTestInstance): string[] {
  return root
    .findAll((n: ReactTestInstance) => n.type === Text)
    .map((n: ReactTestInstance) => {
      const c = n.props.children;
      if (Array.isArray(c)) return c.join("");
      return String(c ?? "");
    });
}

describe("QiblaScreen calibration timer", () => {
  let mountedTree: ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (mountedTree) {
      act(() => {
        mountedTree?.unmount();
      });
      mountedTree = null;
    }
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("rotateDeg өзгерсе де калибрлеу countdown reset болмауы тиіс", () => {
    const state: SensorState = {
      perm: "granted",
      bearing: 120,
      rotateDeg: 3,
      refreshBearing: jest.fn(),
      positionFailed: false,
      locationSource: "gps",
      motionMode: "balanced",
      setMotionMode: jest.fn(),
    };
    useQiblaSensor.mockImplementation(() => state);

    let tree: ReactTestRenderer;
    act(() => {
      tree = create(<QiblaScreen />);
    });
    mountedTree = tree!;
    const pressables = tree!.root.findAll((n: ReactTestInstance) => typeof n.props?.onPress === "function");
    const startButton = pressables.find((node: ReactTestInstance) =>
      node.findAll((c: ReactTestInstance) => c.type === Text && c.props.children === kk.qibla.calibrationStart)
        .length > 0
    );
    expect(startButton).toBeTruthy();

    act(() => {
      startButton!.props.onPress();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    state.rotateDeg = 27;
    act(() => {
      tree!.update(<QiblaScreen />);
    });

    const runningLine = readAllText(tree!.root).find((t) => t.includes("Калибрлеу жүріп жатыр"));
    expect(runningLine).toBeTruthy();
    expect(runningLine).not.toContain("20 с");
  });
});
