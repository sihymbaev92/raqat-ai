import { getTraditionTopicDepth } from "../traditionTopicDepth";

describe("traditionTopicDepth", () => {
  it("maps thinned and family topics to vignettes", () => {
    const ids = [
      "asar",
      "betashar",
      "ulttyq-kiim",
      "dombyra-kui",
      "korimdik-suyinshi",
      "qudalyk",
      "qyz-uzatu",
      "kelin-salemy",
      "neke-qiyu",
      "toy-madenieti",
      "kalyn-mal-siy",
      "korisu-aitu",
      "korshi-aqy",
      "zhylyu-zhinau",
    ];
    for (const id of ids) {
      const depth = getTraditionTopicDepth(id);
      expect(depth?.vignettes.length).toBeGreaterThanOrEqual(1);
      expect((depth?.closing ?? "").length).toBeGreaterThan(20);
    }
  });
});
