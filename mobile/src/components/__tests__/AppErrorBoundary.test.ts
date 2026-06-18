import { appErrorDiagnosticText } from "../AppErrorBoundary";

describe("AppErrorBoundary diagnostics", () => {
  it("hides raw render errors in production-style UI", () => {
    const err = new Error("https://api.example.test/internal-token failed");
    err.name = "ChunkLoadError";

    expect(appErrorDiagnosticText(err, false)).toBeNull();
  });

  it("keeps raw render errors available for development diagnostics", () => {
    const err = new Error("module failed");
    err.name = "RenderError";

    expect(appErrorDiagnosticText(err, true)).toBe("RenderError: module failed");
  });
});
