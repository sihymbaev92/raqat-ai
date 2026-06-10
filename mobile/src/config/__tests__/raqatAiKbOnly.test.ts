jest.mock("../expoExtra", () => ({
  getExpoExtra: () => ({ raqatAiKbOnly: true }),
}));

import { isRaqatAiKbOnlyClient } from "../raqatAiKbOnly";

describe("isRaqatAiKbOnlyClient", () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_RAQAT_AI_KB_ONLY;
  });

  it("defaults to true from app.config.js extra", () => {
    expect(isRaqatAiKbOnlyClient()).toBe(true);
  });

  it("respects EXPO_PUBLIC_RAQAT_AI_KB_ONLY=0", () => {
    process.env.EXPO_PUBLIC_RAQAT_AI_KB_ONLY = "0";
    expect(isRaqatAiKbOnlyClient()).toBe(false);
  });

  it("respects EXPO_PUBLIC_RAQAT_AI_KB_ONLY=1", () => {
    process.env.EXPO_PUBLIC_RAQAT_AI_KB_ONLY = "1";
    expect(isRaqatAiKbOnlyClient()).toBe(true);
  });
});
