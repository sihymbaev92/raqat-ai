import { getRootNavReady, setRootNavReady } from "../rootNavStateStore";

describe("rootNavStateStore", () => {
  beforeEach(() => {
    setRootNavReady(false);
  });

  it("exposes root nav ready flag", () => {
    expect(getRootNavReady()).toBe(false);
    setRootNavReady(true);
    expect(getRootNavReady()).toBe(true);
  });
});
