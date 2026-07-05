import "react-native-webview";

declare module "react-native-webview" {
  interface AndroidWebViewProps {
    /** Android pull-to-refresh indicator (runtime prop; missing from upstream types). */
    refreshing?: boolean;
    onRefresh?: () => void;
  }
}
