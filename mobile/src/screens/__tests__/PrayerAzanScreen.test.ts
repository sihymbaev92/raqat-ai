describe("PrayerAzanScreen", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("preserves soundId off as a no-op instead of falling back to bundled azan", async () => {
    jest.doMock("../../utils/previewPrayerNotifSound", () => ({
      canPreviewPrayerNotifSound: jest.fn((id: string) => id !== "off"),
      previewPrayerNotifSound: jest.fn(async () => undefined),
      stopPreviewPrayerNotifSound: jest.fn(async () => undefined),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { normalizePrayerAzanSoundId } = require("../PrayerAzanScreen") as typeof import("../PrayerAzanScreen");

    expect(normalizePrayerAzanSoundId("off")).toBe("off");
    expect(normalizePrayerAzanSoundId("adhan_madina_clear")).toBe("adhan_haramain");
    expect(normalizePrayerAzanSoundId("legacy_bell")).toBe("adhan_haramain");
  });

  it("does not auto-start azan playback when soundId is off", async () => {
    jest.doMock("../../utils/previewPrayerNotifSound", () => ({
      canPreviewPrayerNotifSound: jest.fn((id: string) => id !== "off"),
      previewPrayerNotifSound: jest.fn(async () => undefined),
      stopPreviewPrayerNotifSound: jest.fn(async () => undefined),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { shouldAutoStartPrayerAzanAudio } = require("../PrayerAzanScreen") as typeof import("../PrayerAzanScreen");

    expect(shouldAutoStartPrayerAzanAudio(false, "off")).toBe(false);
    expect(shouldAutoStartPrayerAzanAudio(false, "adhan_haramain")).toBe(true);
    expect(shouldAutoStartPrayerAzanAudio(true, "adhan_haramain")).toBe(false);
  });

  it("starts native azan on in-app screen open even without alarm session", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { shouldStartNativeAzanOnScreenMount } = require("../PrayerAzanScreen") as typeof import("../PrayerAzanScreen");

    expect(shouldStartNativeAzanOnScreenMount(false, false, "adhan_haramain")).toBe(true);
    expect(shouldStartNativeAzanOnScreenMount(true, false, "adhan_haramain")).toBe(false);
    expect(shouldStartNativeAzanOnScreenMount(true, true, "adhan_haramain")).toBe(true);
    expect(shouldStartNativeAzanOnScreenMount(false, true, "off")).toBe(false);
  });

  it("closePrayerAzanScreen finishes delivery and resets navigation when back is unavailable", () => {
    jest.resetModules();
    const finishAzanDelivery = jest.fn();
    jest.doMock("../../services/prayerFullScreenAzan", () => {
      const actual = jest.requireActual("../../services/prayerFullScreenAzan") as typeof import("../../services/prayerFullScreenAzan");
      return {
        ...actual,
        finishAzanDelivery,
      };
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { closePrayerAzanScreen } = require("../PrayerAzanScreen") as typeof import("../PrayerAzanScreen");

    const reset = jest.fn();
    const goBack = jest.fn();
    closePrayerAzanScreen({
      canGoBack: () => false,
      goBack,
      reset,
    } as never);

    expect(finishAzanDelivery).toHaveBeenCalled();
    expect(reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "Main", params: { screen: "Home" } }],
    });
    expect(goBack).not.toHaveBeenCalled();
  });

  it("uses the exact prayer name in the azan screen heading", async () => {
    jest.resetModules();
    jest.doMock("../../utils/previewPrayerNotifSound", () => ({
      canPreviewPrayerNotifSound: jest.fn((id: string) => id !== "off"),
      previewPrayerNotifSound: jest.fn(async () => undefined),
      stopPreviewPrayerNotifSound: jest.fn(async () => undefined),
      playAzanDuaAudio: jest.fn(async () => undefined),
      getPreviewAzanPlaybackStatus: jest.fn(async () => null),
      getPreviewAzanDuaPlaybackStatus: jest.fn(async () => null),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prayerAzanKickerForLabel } = require("../PrayerAzanScreen") as typeof import("../PrayerAzanScreen");

    expect(prayerAzanKickerForLabel("Бесін")).toBe("Бесін намазы кірді");
    expect(prayerAzanKickerForLabel("")).toBe("Намаз уақыты кірді");
  });

  it("builds azan text through the post-azan dua", async () => {
    jest.doMock("../../utils/previewPrayerNotifSound", () => ({
      canPreviewPrayerNotifSound: jest.fn((id: string) => id !== "off"),
      previewPrayerNotifSound: jest.fn(async () => undefined),
      stopPreviewPrayerNotifSound: jest.fn(async () => undefined),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { buildAzanTextBlocks } = require("../PrayerAzanScreen") as typeof import("../PrayerAzanScreen");

    const regular = buildAzanTextBlocks("asr");
    expect(regular[0]?.translit).toBe("Аллаһу әкбар");
    expect(regular.at(-1)?.id).toBe("azan-dua");
    expect(regular.at(-1)?.arabic).toContain("مَقَامًا مَحْمُودًا");
    expect(regular.at(-1)?.arabic).not.toContain("إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ");
    expect(regular.at(-1)?.meaning).toContain("Махмуд шыңына");
    expect(regular.at(-1)?.meaning).not.toContain("Шүкір");

    const fajr = buildAzanTextBlocks("fajr");
    expect(fajr.some((x) => x.id === "fajr-extra")).toBe(true);
  });

  it("keeps azan text highlights behind the audio pace", async () => {
    jest.doMock("../../utils/previewPrayerNotifSound", () => ({
      canPreviewPrayerNotifSound: jest.fn((id: string) => id !== "off"),
      previewPrayerNotifSound: jest.fn(async () => undefined),
      stopPreviewPrayerNotifSound: jest.fn(async () => undefined),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { buildAzanTextBlocks, buildAzanTextSchedule } = require("../PrayerAzanScreen") as typeof import("../PrayerAzanScreen");

    const regular = buildAzanTextBlocks("asr");
    const schedule = buildAzanTextSchedule(regular);

    expect(schedule[0]).toBe(0);
    expect(schedule[1]).toBeGreaterThanOrEqual(20_000);
    expect(schedule[regular.findIndex((x) => x.id === "azan-dua")]).toBeGreaterThanOrEqual(120_000);
  });

  it("closes azan screen after azan and dua fully finish", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { shouldClosePrayerAzanAfterFullPlayback } = require("../PrayerAzanScreen") as typeof import("../PrayerAzanScreen");

    expect(
      shouldClosePrayerAzanAfterFullPlayback({
        stopped: false,
        soundOff: false,
        duaStarted: true,
        sessionFullyFinished: true,
        duaJsFullyFinished: false,
        duaStatusPlaying: false,
      })
    ).toBe(true);

    expect(
      shouldClosePrayerAzanAfterFullPlayback({
        stopped: false,
        soundOff: false,
        duaStarted: true,
        sessionFullyFinished: false,
        duaJsFullyFinished: true,
        duaStatusPlaying: false,
      })
    ).toBe(true);

    expect(
      shouldClosePrayerAzanAfterFullPlayback({
        stopped: false,
        soundOff: false,
        duaStarted: false,
        sessionFullyFinished: false,
        duaJsFullyFinished: false,
        duaStatusPlaying: false,
      })
    ).toBe(false);
  });

  it("localizes azan text for Russian and English app languages", async () => {
    jest.doMock("../../utils/previewPrayerNotifSound", () => ({
      canPreviewPrayerNotifSound: jest.fn((id: string) => id !== "off"),
      previewPrayerNotifSound: jest.fn(async () => undefined),
      stopPreviewPrayerNotifSound: jest.fn(async () => undefined),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const screen = require("../PrayerAzanScreen") as typeof import("../PrayerAzanScreen");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const runtime = require("../../i18n/runtime") as typeof import("../../i18n/runtime");

    await runtime.setCurrentLocale("ru");
    expect(screen.buildAzanTextBlocks("asr")[0]?.meaning).toBe("Аллах Велик.");
    expect(screen.buildAzanTextBlocks("asr").at(-1)?.meaning).toContain("восхваляемое место");

    await runtime.setCurrentLocale("en");
    expect(screen.buildAzanTextBlocks("asr")[0]?.meaning).toBe("Allah is the Greatest.");
    expect(screen.buildAzanTextBlocks("asr").at(-1)?.meaning).toContain("praised station");

    await runtime.setCurrentLocale("kk");
  });
});
