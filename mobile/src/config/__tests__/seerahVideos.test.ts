import { SEERAH_LESSON_COUNT, urlForSeerahLesson } from "../seerahVideos";

describe("urlForSeerahLesson", () => {
  it("түпнұсқа watch URL берілген (3-сабақ = нақты бейне)", () => {
    const u = urlForSeerahLesson(3);
    expect(u).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+$/);
  });

  it("38-сабақ — нақты бейне id", () => {
    const u = urlForSeerahLesson(38);
    expect(u).toBe("https://www.youtube.com/watch?v=uAigXDEzbVI");
  });

  it("шектеу сыртында RangeError береді", () => {
    expect(() => urlForSeerahLesson(0)).toThrow(RangeError);
    expect(() => urlForSeerahLesson(39)).toThrow(RangeError);
  });

  it("SEERAH_LESSON_COUNT = 38", () => {
    expect(SEERAH_LESSON_COUNT).toBe(38);
  });
});
