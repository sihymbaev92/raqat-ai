import { parseCounterNotifyPayload } from "../parseCounterPayload";
import { pickBestDriver, raqatOpenDriver } from "./index";

describe("parseCounterNotifyPayload", () => {
  it("parses single-byte increment", () => {
    expect(parseCounterNotifyPayload(new Uint8Array([1]))).toEqual({ increment: 1 });
  });

  it("parses 16-bit absolute count", () => {
    expect(parseCounterNotifyPayload(new Uint8Array([33, 0]))).toEqual({ absolute: 33 });
  });

  it("parses utf8 counter text", () => {
    const bytes = new TextEncoder().encode("COUNT:12");
    expect(parseCounterNotifyPayload(bytes)).toEqual({ absolute: 12 });
  });
});

describe("pickBestDriver", () => {
  it("prefers RAQAT service uuid", () => {
    const driver = pickBestDriver({
      name: "Generic",
      serviceUuids: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    });
    expect(driver.id).toBe(raqatOpenDriver.id);
  });

  it("matches zikr ring names", () => {
    const driver = pickBestDriver({ name: "iQIBLA Zikr M02", serviceUuids: [] });
    expect(driver.id).not.toBe("universal-notify-v1");
  });
});
