import { traditionAitSourceStatusLine } from "../traditionAitSourceStatus";

const labels = {
  ok: (n: number) => `${n} үзінді`,
  notConfigured: "қосылмаған",
  network: "желі",
  empty: "бос",
  error: "қате",
};

describe("traditionAitSourceStatusLine", () => {
  it("reports snippet count when ok", () => {
    expect(
      traditionAitSourceStatusLine(
        { id: "halaldamu", label: "h", url: "u", ok: true, snippets: ["a", "b"] },
        labels
      )
    ).toBe("2 үзінді");
  });

  it("reports not configured", () => {
    expect(
      traditionAitSourceStatusLine(
        { id: "raqat", label: "r", url: "", ok: false, snippets: [], error: "not_configured" },
        labels
      )
    ).toBe("қосылмаған");
  });
});
