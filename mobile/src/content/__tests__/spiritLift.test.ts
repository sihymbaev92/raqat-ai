import { pickSpiritLift } from "../spiritLift";

describe("spiritLift", () => {
  it("returns non-empty quote and attribution", () => {
    const q = pickSpiritLift();
    expect(q.text.length).toBeGreaterThan(5);
    expect(q.attribution.length).toBeGreaterThan(1);
  });

  it("returns different quote when excluding previous", () => {
    const first = pickSpiritLift();
    let other = first;
    for (let i = 0; i < 15; i++) {
      other = pickSpiritLift(first.text);
      if (other.text !== first.text) break;
    }
    expect(other.text).not.toBe(first.text);
  });
});
