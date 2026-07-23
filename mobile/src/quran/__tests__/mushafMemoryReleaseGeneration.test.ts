import {
  cancelScheduledMushafMemoryRelease,
  scheduleReleaseMushafScreenMemory,
  touchMushafAccess,
} from "../mushafMemoryRelease";

describe("mushafMemoryRelease generation cancel", () => {
  afterEach(() => {
    cancelScheduledMushafMemoryRelease();
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
});
