import "react-native-webview";

declare module "react-native-webview" {
  interface WebViewProps {
    /** Android pull-to-refresh indicator (runtime prop; missing from upstream types). */
    refreshing?: boolean;
    onRefresh?: () => void;
  }
  interface IOSWebViewProps {
    refreshing?: boolean;
    onRefresh?: () => void;
  }
  interface AndroidWebViewProps {
    refreshing?: boolean;
    onRefresh?: () => void;
  }
}
