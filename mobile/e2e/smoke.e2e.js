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

  it("opens the main production routes via deep links", async () => {
    const routes = [
      { url: "raqat://", id: "screen-main-home" },
      { url: "raqat://prayer", id: "screen-main-prayer" },
      { url: "raqat://articles", id: "screen-main-articles" },
      { url: "raqat://saved", id: "screen-main-saved" },
      { url: "raqat://profile", id: "screen-main-profile" },
    ];

    for (const route of routes) {
      await device.openURL({ url: route.url });
      await waitFor(element(by.id(route.id))).toExist().withTimeout(8000);
    }
  });
});
