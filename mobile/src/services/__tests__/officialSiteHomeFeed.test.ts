import fs from "fs";
import path from "path";
import {
  interleaveOfficialHomeFeeds,
  parseFatuaHomeHtml,
  parseMuftyatHomeHtml,
} from "../officialSiteHomeFeed";

const repoRoot = path.resolve(__dirname, "../../../..");
const fatuaSample = fs.readFileSync(
  path.join(repoRoot, "tests/fixtures/fatua-home-sample.html"),
  "utf8"
);
const muftyatSample = fs.readFileSync(
  path.join(repoRoot, "tests/fixtures/muftyat-home-sample.html"),
  "utf8"
);

describe("officialSiteHomeFeed", () => {
  it("parses fatua.kz home articles with images", () => {
    const items = parseFatuaHomeHtml(fatuaSample, 4);
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items[0]?.site).toBe("fatua");
    expect(items[0]?.imageUrl).toMatch(/^https:\/\/fatua\.kz\/media\//);
    expect(items[0]?.url).toMatch(/^https:\/\/fatua\.kz\/kk\/qa\/read\//);
    expect(items[0]?.title.length).toBeGreaterThan(5);
  });

  it("parses muftyat.kz home slider news with images", () => {
    const items = parseMuftyatHomeHtml(muftyatSample, 4);
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items[0]?.site).toBe("muftyat");
    expect(items[0]?.imageUrl).toMatch(/^https:\/\/imgs\.muftyat\.kz\/orxxl\//);
    expect(items[0]?.url).toMatch(/^https:\/\/www\.muftyat\.kz\/kk\/news\//);
  });

  it("interleaves fatua and muftyat feeds", () => {
    const fatua = parseFatuaHomeHtml(fatuaSample, 2);
    const muftyat = parseMuftyatHomeHtml(muftyatSample, 2);
    const merged = interleaveOfficialHomeFeeds(fatua, muftyat);
    expect(merged.map((x) => x.site)).toEqual(["fatua", "muftyat", "fatua", "muftyat"]);
  });
});
