import { SEERAH_LESSON_COUNT, urlForSeerahLesson } from "../seerahVideos";

describe("urlForSeerahLesson", () => {
  it("түпнұсқа сілтеме жоқ кезде YouTube іздеуін қайтарады", () => {
    const u = urlForSeerahLesson(3);
    expect(u).toContain("youtube.com");
    expect(u).toContain("search_query=");
    expect(decodeURIComponent(u)).toContain("3");
  });

  it("38-сабақ үшін жұмыс істейді", () => {
    const u = urlForSeerahLesson(38);
    expect(decodeURIComponent(u)).toContain("38");
  });

  it("шектеу сыртында RangeError береді", () => {
    expect(() => urlForSeerahLesson(0)).toThrow(RangeError);
    expect(() => urlForSeerahLesson(39)).toThrow(RangeError);
  });

  it("SEERAH_LESSON_COUNT = 38", () => {
    expect(SEERAH_LESSON_COUNT).toBe(38);
  });
});
