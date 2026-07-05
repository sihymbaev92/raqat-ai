import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { KmdbHubEmbeddedSiteRow } from "../KmdbHubEmbeddedSiteRow";
import type { ThemeColors } from "../../theme/colors";

jest.mock("../OfficialSiteFullWebView", () => ({
  OfficialSiteFullWebView: ({ url, previewHeight }: { url: string; previewHeight?: number }) => (
    <Text testID="mock-webview">{`${url}|${previewHeight ?? 0}`}</Text>
  ),
}));

const colors: ThemeColors = {
  bg: "#fff",
  card: "#f5f5f5",
  text: "#111",
  muted: "#666",
  border: "#ddd",
  accent: "#0a8",
  accentDark: "#086",
  accentSurface: "rgba(0,170,136,0.12)",
  accentSurfaceStrong: "rgba(0,170,136,0.24)",
  danger: "#c00",
  success: "#080",
  warning: "#fa0",
  overlay: "rgba(0,0,0,0.4)",
};

describe("KmdbHubEmbeddedSiteRow", () => {
  it("renders muftyat preview with home url and height", () => {
    const { getByText, getByTestId } = render(
      <KmdbHubEmbeddedSiteRow
        site="muftyat"
        label="Muftyat.kz"
        domain="muftyat.kz"
        previewHeight={320}
        colors={colors}
        onExpand={() => {}}
      />
    );
    expect(getByText("Muftyat.kz")).toBeTruthy();
    expect(getByText("muftyat.kz")).toBeTruthy();
    expect(getByTestId("mock-webview").props.children).toContain("https://www.muftyat.kz/kk/");
    expect(getByTestId("mock-webview").props.children).toContain("320");
  });
});
