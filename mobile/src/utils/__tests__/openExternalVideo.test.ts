import { youtubeVideoIdFromWatchUrl } from "../openExternalVideo";

describe("openExternalVideo", () => {
  it("parses youtube watch id", () => {
    expect(youtubeVideoIdFromWatchUrl("https://www.youtube.com/watch?v=uAigXDEzbVI")).toBe("uAigXDEzbVI");
    expect(youtubeVideoIdFromWatchUrl("https://youtu.be/abc123?si=1")).toBeNull();
  });
});
