import React from "react";
import { ScrollView, View, type ScrollViewProps, type ViewProps, type ViewStyle } from "react-native";
import {
  screenFitExplicitEdgeStyle,
  screenFitContainerStyle,
  screenFitScrollContentStyle,
  useScreenFitMetrics,
} from "../theme/screenFit";

type ScreenFitViewProps = ViewProps & {
  maxed?: boolean;
};

export function ScreenFitView({ maxed = true, style, ...props }: ScreenFitViewProps) {
  const screenFit = useScreenFitMetrics();
  return <View {...props} style={[maxed ? screenFitContainerStyle(screenFit) : null, style]} />;
}

type ScreenFitScrollViewProps = ScrollViewProps & {
  top?: number;
  bottom?: number;
  includeHorizontalPadding?: boolean;
};

export function ScreenFitScrollView({
  bottom,
  contentContainerStyle,
  includeHorizontalPadding,
  top,
  ...props
}: ScreenFitScrollViewProps) {
  const screenFit = useScreenFitMetrics();
  const autoFitContentStyle: ViewStyle = screenFitScrollContentStyle(screenFit, {
    bottom,
    includeHorizontalPadding,
    top,
  });
  const explicitEdgeStyle = screenFitExplicitEdgeStyle({ top, bottom });

  return (
    <ScrollView
      {...props}
      contentContainerStyle={[autoFitContentStyle, contentContainerStyle, explicitEdgeStyle]}
    />
  );
}
