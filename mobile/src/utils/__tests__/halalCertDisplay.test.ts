import {
  halalCertBadgeColors,
  halalCertTone,
} from "../halalCertDisplay";

describe("halalCertDisplay", () => {
  it("maps API and Kazakh labels to tones", () => {
    expect(halalCertTone("active")).toBe("ok");
    expect(halalCertTone("Белсенді сертификат")).toBe("ok");
    expect(halalCertTone("expired")).toBe("bad");
    expect(halalCertTone("Мерзімі өткен")).toBe("bad");
    expect(halalCertTone("draft")).toBe("warn");
    expect(halalCertTone("Жоба / күтуде")).toBe("warn");
  });

  it("returns distinct badge palettes per tone", () => {
    const ok = halalCertBadgeColors("ok", false);
    const bad = halalCertBadgeColors("bad", false);
    expect(ok.bg).not.toBe(bad.bg);
    expect(ok.text).not.toBe(bad.text);
  });
});
