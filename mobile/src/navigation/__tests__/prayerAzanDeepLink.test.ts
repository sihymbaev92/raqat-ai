import { parsePrayerAzanQueryParams } from "../linking";

describe("PrayerAzan deep link params", () => {
  it("parses azan query params including soundId off", () => {
    expect(
      parsePrayerAzanQueryParams(
        "azan?label=%D0%95%D0%BA%D1%96%D0%BD%D1%82%D1%96&enteredTitle=%D0%95%D0%BA%D1%96%D0%BD%D1%82%D1%96%20%D0%BD%D0%B0%D0%BC%D0%B0%D0%B7%D1%8B%20%D0%BA%D1%96%D1%80%D0%B4%D1%96&soundId=off&salatKey=asr"
      )
    ).toMatchObject({
      label: "Екінті",
      enteredTitle: "Екінті намазы кірді",
      soundId: "off",
      salatKey: "asr",
    });
  });

  it("strips shell quotes from query param values", () => {
    expect(parsePrayerAzanQueryParams('azan?soundId="off"&salatKey=asr"')).toMatchObject({
      soundId: "off",
      salatKey: "asr",
    });
  });
});
