import {
  cancelScheduledMushafMemoryRelease,
  scheduleReleaseMushafScreenMemory,
  takeMushafNeedsReloadAfterInterruptedRelease,
  touchMushafAccess,
} from "../mushafMemoryRelease";

describe("mushafMemoryRelease generation cancel", () => {
  afterEach(() => {
    cancelScheduledMushafMemoryRelease();
    takeMushafNeedsReloadAfterInterruptedRelease();
    jest.useRealTimers();
  });

  it("does not run onReleased after touch cancels an in-flight schedule", async () => {
    jest.useFakeTimers();
    const onReleased = jest.fn();
    scheduleReleaseMushafScreenMemory({ delayMs: 100, onReleased });
    jest.advanceTimersByTime(100);
    touchMushafAccess();
    await Promise.resolve();
    await Promise.resolve();
    expect(onReleased).not.toHaveBeenCalled();
  });

  it("flags UI reload when focus returns during an in-flight release", async () => {
    jest.useFakeTimers();
    scheduleReleaseMushafScreenMemory({ delayMs: 50, onReleased: jest.fn() });
    jest.advanceTimersByTime(50);
    touchMushafAccess();
    expect(takeMushafNeedsReloadAfterInterruptedRelease()).toBe(true);
    expect(takeMushafNeedsReloadAfterInterruptedRelease()).toBe(false);
  });
});
