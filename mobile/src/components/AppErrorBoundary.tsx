import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";

type Props = { children: ReactNode };
type State = { err: Error | null };

/**
 * Суық іске қосуда рендер қатесін (ақ экран) ұстап, қайта кіру сынағы.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(e: Error): State {
    return { err: e };
  }

  componentDidCatch(e: Error, info: ErrorInfo): void {
    console.error("AppErrorBoundary", e, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.err) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Қолданба қатесі</Text>
          <Text style={styles.hint}>
            «Қайта» — қайта сынау. Себепті көшіру: лог / экран.
          </Text>
          <ScrollView style={styles.pre}>
            <Text style={styles.msg} selectable>
              {this.state.err.name}: {this.state.err.message}
            </Text>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
            onPress={() => this.setState({ err: null })}
            accessibilityRole="button"
            accessibilityLabel="Қайта"
          >
            <Text style={styles.btnTxt}>Қайта</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#05080B",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#F2F4F5", marginBottom: 8 },
  hint: { fontSize: 12, color: "#7A8B94", marginBottom: 12 },
  pre: { maxHeight: 200, marginBottom: 20 },
  msg: { color: "#f29393", fontSize: 12 },
  btn: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "rgba(38, 166, 154, 0.3)",
  },
  btnTxt: { color: "#E0F2F1", fontWeight: "700" },
});
