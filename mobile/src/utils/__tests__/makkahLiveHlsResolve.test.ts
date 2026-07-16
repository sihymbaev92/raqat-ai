import { pickHighestHlsVariantFromMaster } from "../makkahLiveHlsResolve";

describe("makkahLiveHlsResolve", () => {
  it("picks 1920x1080 over lower ABR rungs", () => {
    const master = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=9000000,RESOLUTION=1920x1080
hd/chunks.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1600000,RESOLUTION=854x480
sd/chunks.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=640x360
ld/chunks.m3u8
`;
    const hit = pickHighestHlsVariantFromMaster(master, "https://live.example.com/master.m3u8");
    expect(hit?.width).toBe(1920);
    expect(hit?.height).toBe(1080);
    expect(hit?.url).toBe("https://live.example.com/hd/chunks.m3u8");
  });
});
