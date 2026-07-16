import { resolveOfficialSiteWebBackAttempt } from "../officialSiteWebBackLogic";

const ESCAPE_MS = 750;

describe("resolveOfficialSiteWebBackAttempt", () => {
  it("consumes first back when WebView can go back", () => {
    const r = resolveOfficialSiteWebBackAttempt({
      enabled: true,
      canGoBack: true,
      lastWebBackAt: 0,
      forceLeave: false,
      now: 1000,
      escapeMs: ESCAPE_MS,
    });
    expect(r.consume).toBe(true);
    expect(r.lastWebBackAt).toBe(1000);
    expect(r.forceLeave).toBe(false);
  });

  it("escape sets forceLeave so beforeRemove cannot re-consume", () => {
    const first = resolveOfficialSiteWebBackAttempt({
      enabled: true,
      canGoBack: true,
      lastWebBackAt: 0,
      forceLeave: false,
      now: 1000,
      escapeMs: ESCAPE_MS,
    });
    const escape = resolveOfficialSiteWebBackAttempt({
      enabled: true,
      canGoBack: true,
      lastWebBackAt: first.lastWebBackAt,
      forceLeave: first.forceLeave,
      now: 1000 + 200,
      escapeMs: ESCAPE_MS,
    });
    expect(escape.consume).toBe(false);
    expect(escape.forceLeave).toBe(true);

    // beforeRemove қайта шақыру — экран шығуы керек
    const beforeRemove = resolveOfficialSiteWebBackAttempt({
      enabled: true,
      canGoBack: true,
      lastWebBackAt: escape.lastWebBackAt,
      forceLeave: escape.forceLeave,
      now: 1000 + 250,
      escapeMs: ESCAPE_MS,
    });
    expect(beforeRemove.consume).toBe(false);
    expect(beforeRemove.forceLeave).toBe(true);
  });

  it("leaves immediately when WebView cannot go back", () => {
    const r = resolveOfficialSiteWebBackAttempt({
      enabled: true,
      canGoBack: false,
      lastWebBackAt: 500,
      forceLeave: false,
      now: 2000,
      escapeMs: ESCAPE_MS,
    });
    expect(r.consume).toBe(false);
    expect(r.forceLeave).toBe(false);
  });
});
