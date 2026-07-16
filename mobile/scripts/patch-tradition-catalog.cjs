const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "../src/content/traditionTopicsCatalog.ts");
let s = fs.readFileSync(p, "utf8");

const start = s.indexOf("export const TRADITION_AUDIO_BLESSINGS");
const end = s.indexOf("export const TRADITION_ARTICLES");
if (start < 0 || end < 0) throw new Error("markers not found");

const insert = `/** Ескі topic audioIds → жаңа каталог id (100 бата). */
const LEGACY_BATA_AUDIO_ALIASES: Record<string, string> = {
  "bata-jalpy": "bata-001",
  "besik-batasi": "bata-021",
  "tusau-batasi": "bata-022",
  "as-batasi": "bata-065",
  "zhol-batasi": "bata-049",
  "birlik-batasi": "bata-091",
  "bata-bala": "bata-024",
  "bata-kelin": "bata-032",
  "bata-kuda": "bata-031",
  "bata-ui": "bata-099",
  "bata-shetel": "bata-050",
  "bata-nauqas": "bata-045",
  "bata-toishy": "bata-057",
};

export const TRADITION_AUDIO_BLESSINGS: TraditionAudioBlessing[] = getAllTraditionBatas();

function resolveBlessingId(id: string): string {
  return LEGACY_BATA_AUDIO_ALIASES[id] ?? id;
}

`;

s = s.slice(0, start) + insert + s.slice(end);

s = s.replace(
  `export function getTraditionAudioById(id: string): TraditionAudioBlessing | undefined {
  return TRADITION_AUDIO_BLESSINGS.find((audio) => audio.id === id);
}`,
  `export function getTraditionAudioById(id: string): TraditionAudioBlessing | undefined {
  const resolved = resolveBlessingId(id);
  return TRADITION_AUDIO_BLESSINGS.find((audio) => audio.id === resolved);
}`
);

s = s.replace(
  /export function getRelatedTraditionAudios\(topicId: string\): TraditionAudioBlessing\[\] \{[\s\S]*?\n\}/,
  `export function getRelatedTraditionAudios(topicId: string, query = ""): TraditionAudioBlessing[] {
  if (topicId === "bata-beru") {
    return query.trim() ? searchTraditionBatas(query) : getAllTraditionBatas();
  }
  const topic = getTraditionTopicById(topicId);
  const ids = topic?.audioIds ?? [];
  if (ids.length) {
    const byId = new Map(TRADITION_AUDIO_BLESSINGS.map((audio) => [audio.id, audio]));
    return ids
      .map((id) => byId.get(resolveBlessingId(id)))
      .filter((audio): audio is TraditionAudioBlessing => Boolean(audio));
  }
  return TRADITION_AUDIO_BLESSINGS.filter((audio) => audio.topicId === topicId);
}`
);

if (!s.includes("din-dastur-connection")) {
  s = s.replace(
    `excerpt: "Дәстүрді сақтағанда оның пайдалы жағын алып, сенімге қайшы тұсын ажырату маңызды.",
  },
  {
    id: "child-care-adab"`,
    `excerpt: "Дәстүрді сақтағанда оның пайдалы жағын алып, сенімге қайшы тұсын ажырату маңызды.",
  },
  {
    id: "din-dastur-connection",
    topicId: "dastur-men-din-negiz",
    title: "Дін мен дәстүр: қалай үйлеседі?",
    source: "RAHAT OMIR",
    tag: "Негіз",
    excerpt:
      "Үш тірек — ақида, ғибадат, әдеп. Дәстүр діннің орнына қойылмайды; игі әдет қабылданады, сенімге қайшы тұсы алынып тасталады.",
  },
  {
    id: "child-care-adab"`
  );
}

s = s.replace(
  `articleIds: ["tradition-values"],
  },
  {
    id: "yrymdar-men-din"`,
  `articleIds: ["tradition-values", "din-dastur-connection"],
  },
  {
    id: "yrymdar-men-din"`
);

fs.writeFileSync(p, s, "utf8");
console.log("patched traditionTopicsCatalog");
