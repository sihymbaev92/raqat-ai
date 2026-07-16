import { HAJJ_MUFTYAT_PAGES } from "../hajjMuftyatPages";
import { getHajjMuftyatPageText } from "../hajjMuftyatPageText";
import { HAJJ_BOOK_SECTIONS } from "../hajjBookContent";
import { TRADITION_TOPICS } from "../traditionTopicsCatalog";
import { SEERAH_LESSON_COUNT, urlForSeerahLesson } from "../../config/seerahVideos";

describe("Seerah / Hajj / Tradition offline bundles", () => {
  it("seerah lesson list is fully addressable offline", () => {
    expect(SEERAH_LESSON_COUNT).toBe(38);
    for (let n = 1; n <= SEERAH_LESSON_COUNT; n += 1) {
      expect(urlForSeerahLesson(n)).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    }
  });

  it("hajj muftyat text bundled; scan images on CDN", () => {
    expect(HAJJ_MUFTYAT_PAGES).toHaveLength(214);
    const first = HAJJ_MUFTYAT_PAGES[0]!;
    expect(first.source).toEqual(
      expect.objectContaining({ uri: expect.stringMatching(/page-001\.jpg$/) })
    );
    expect(getHajjMuftyatPageText(7)?.readable).toBe(true);
    expect(HAJJ_BOOK_SECTIONS.length).toBeGreaterThan(20);
  });

  it("tradition topics fully offline text", () => {
    expect(TRADITION_TOPICS.length).toBeGreaterThanOrEqual(30);
    for (const t of TRADITION_TOPICS) {
      expect(t.title.trim().length).toBeGreaterThan(0);
      expect(t.summary.trim().length).toBeGreaterThan(20);
      expect(t.howTo.length).toBeGreaterThan(0);
    }
  });
});
