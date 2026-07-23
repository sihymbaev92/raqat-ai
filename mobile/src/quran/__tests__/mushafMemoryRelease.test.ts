import {
  mushafWasUsedRecently,
  scheduleReleaseMushafScreenMemory,
  touchMushafAccess,
  cancelScheduledMushafMemoryRelease,
  MUSHAF_MEMORY_RELEASE_DELAY_MS,
} from "../mushafMemoryRelease";

describe("mushafMemoryRelease", () => {
  afterEach(() => {
    cancelScheduledMushafMemoryRelease();
  });

  it("reports recent use only after touch", () => {
    expect(mushafWasUsedRecently(60_000)).toBe(false);
    touchMushafAccess();
    expect(mushafWasUsedRecently(60_000)).toBe(true);
  });

  it("defaults to a long idle delay so short navigation stays warm", () => {
    expect(MUSHAF_MEMORY_RELEASE_DELAY_MS).toBeGreaterThanOrEqual(30_000);
  });

  it("cancels scheduled release when mushaf is touched again", () => {
    jest.useFakeTimers();
    const onReleased = jest.fn();
    scheduleReleaseMushafScreenMemory({ delayMs: 1000, onReleased });
    touchMushafAccess();
    jest.advanceTimersByTime(1500);
    expect(onReleased).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
