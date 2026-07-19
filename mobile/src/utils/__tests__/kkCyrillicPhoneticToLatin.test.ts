import { kkCyrillicPhoneticToLatin } from "../kkCyrillicPhoneticToLatin";

describe("kkCyrillicPhoneticToLatin", () => {
  it("converts common Kazakh phonetic syllables", () => {
    expect(kkCyrillicPhoneticToLatin("бисмилләһир")).toBe("bismillahir");
    expect(kkCyrillicPhoneticToLatin("рахманир")).toBe("rahmanir");
  });
});
