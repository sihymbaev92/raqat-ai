describe("azanPlaybackSync", () => {
  it("stopPreviewAzanPlaybackOnly stops preview without finishing delivery", async () => {
    const finishAzanDelivery = jest.fn();
    const stopPreview = jest.fn(async () => undefined);
    jest.resetModules();
    jest.doMock("../prayerFullScreenAzan", () => ({
      finishAzanDelivery,
      getNativeAzanPlaybackStatus: jest.fn(async () => null),
    }));
    jest.doMock("../../utils/previewPrayerNotifSound", () => ({
      stopPreviewPrayerNotifSound: stopPreview,
      getPreviewAzanPlaybackStatus: jest.fn(async () => null),
      getPreviewAzanDuaPlaybackStatus: jest.fn(async () => null),
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("../azanPlaybackSync") as typeof import("../azanPlaybackSync");
    await mod.stopPreviewAzanPlaybackOnly();
    expect(finishAzanDelivery).not.toHaveBeenCalled();
    expect(stopPreview).toHaveBeenCalled();
  });

  it("stopAllAzanPlayback finishes native delivery and stops preview", async () => {
    const finishAzanDelivery = jest.fn();
    const stopPreview = jest.fn(async () => undefined);
    jest.resetModules();
    jest.doMock("../prayerFullScreenAzan", () => ({
      finishAzanDelivery,
      getNativeAzanPlaybackStatus: jest.fn(async () => null),
    }));
    jest.doMock("../../utils/previewPrayerNotifSound", () => ({
      stopPreviewPrayerNotifSound: stopPreview,
      getPreviewAzanPlaybackStatus: jest.fn(async () => null),
      getPreviewAzanDuaPlaybackStatus: jest.fn(async () => null),
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("../azanPlaybackSync") as typeof import("../azanPlaybackSync");
    await mod.stopAllAzanPlayback();
    expect(finishAzanDelivery).toHaveBeenCalled();
    expect(stopPreview).toHaveBeenCalled();
  });
});
