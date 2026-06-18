import { headingFromLocationHeading } from "../qiblaLocationHeading";

describe("headingFromLocationHeading", () => {
  const declKz = 9;

  test("Android: magHeading бар болса, қолданба declination қосылған бағыт қолданылады", () => {
    const m = 100;
    const expoTrue = (m + 8.1 + 360) % 360;
    const h = { magHeading: m, trueHeading: expoTrue, accuracy: 3 };
    const fromMagDecl = headingFromLocationHeading(h, declKz, "android");
    expect(fromMagDecl).toBeCloseTo((m + declKz) % 360, 5);
  });

  test("Android: true≈mag бірақ аймақта деклинация үлкен — географиялық mag+decl", () => {
    const m = 200;
    const h = { magHeading: m, trueHeading: m, accuracy: 3 };
    expect(headingFromLocationHeading(h, declKz, "android")).toBeCloseTo((m + declKz) % 360, 5);
  });

  test("Android: датчик дәлдігі төмен — mag+decl", () => {
    const m = 50;
    const t = (m + 7 + 360) % 360;
    const h = { magHeading: m, trueHeading: t, accuracy: 1 };
    expect(headingFromLocationHeading(h, declKz, "android")).toBeCloseTo((m + declKz) % 360, 5);
  });

  test("iOS: true≈mag және decl үлкен — mag+decl", () => {
    const m = 310;
    const h = { magHeading: m, trueHeading: m, accuracy: 3 };
    expect(headingFromLocationHeading(h, declKz, "ios")).toBeCloseTo((m + declKz) % 360, 5);
  });

  test("iOS: дәлдік жақсы, true қолданылады", () => {
    const h = { magHeading: 0, trueHeading: 12, accuracy: 3 };
    expect(headingFromLocationHeading(h, declKz, "ios")).toBe(12);
  });
});
