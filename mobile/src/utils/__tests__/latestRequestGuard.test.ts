import { beginLatestRequest } from "../latestRequestGuard";

describe("beginLatestRequest", () => {
  it("marks earlier overlapping requests as stale", () => {
    const ref = { current: 0 };

    const first = beginLatestRequest(ref);
    expect(first.requestSeq).toBe(1);
    expect(first.isCurrentRequest()).toBe(true);

    const second = beginLatestRequest(ref);
    expect(second.requestSeq).toBe(2);
    expect(first.isCurrentRequest()).toBe(false);
    expect(second.isCurrentRequest()).toBe(true);
  });
});
