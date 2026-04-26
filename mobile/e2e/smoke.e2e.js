/**
 * Smoke: қолданба іске қосылады, түпкілі View көрінеді (API health — серверсіз Detox; API pytest-пен тексеріледі).
 */
describe("Smoke", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("renders root", async () => {
    await expect(element(by.id("raqat-app-root"))).toExist();
  });
});
