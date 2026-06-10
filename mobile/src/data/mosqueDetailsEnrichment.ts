export type MosqueDetailSource = {
  title: string;
  url: string;
};

export type MosqueDetailEnrichment = {
  imamName?: string;
  imamRole?: string;
  phone?: string;
  photoUrl?: string;
  website?: string;
  socialUrls?: string[];
  scheduleText?: string;
  info?: string;
  note?: string;
  verifiedAt?: string;
  confidence?: "verified" | "partial" | "map_only";
  sources: MosqueDetailSource[];
};

export type MosqueDetailFallbackInput = {
  id: string;
  name: string;
  address?: string;
  fullAddress?: string;
  regionName?: string;
  mapUrl?: string;
  phone?: string;
  contactPhones?: string[];
  websites?: string[];
  socialUrls?: string[];
  scheduleText?: string;
  photoUrl?: string;
};

const DEFAULT_2GIS_CATALOG_DATE = "2026-05-21";

const MOSQUE_DETAILS_BY_2GIS_ID: Record<string, MosqueDetailEnrichment> = {
  "70000001026474066": {
    imamName: "Ералы Сапарбайұлы",
    imamRole: "Бас имам",
    phone: "+7 (7252) 66-77-55",
    verifiedAt: "2026-06-08",
    confidence: "partial",
    info:
      "Әл-Фараби ауданының орталық «Ордабасы» мешіті. Ашық деректе Ералы Сапарбайұлы ҚМДБ РАНТ мүшесі және Шымкент қаласы Ордабасы мешітінің бас имамы ретінде көрсетілген.",
    sources: [
      {
        title: "AMIN.KZ: Ералы Сапарбайұлы — Ордабасы мешітінің бас имамы",
        url: "https://amin.kz/atyrauda-rant-mushesi-eraly-saparbajuly-zhamaghatpen-kezdesti/",
      },
      {
        title: "Yandex Maps: Ордабасы телефоны",
        url: "https://yandex.kz/maps/org/ordabasy/101886138125/",
      },
      {
        title: "2GIS: Ордабасы, Әл-Фараби ауданының орталық мешіті",
        url: "https://2gis.kz/shymkent/firm/70000001026474066",
      },
    ],
  },
  "70000001026015742": {
    imamName: "Бахытжанұлы Нұрлан",
    imamRole: "Бас имам (2018 ж. тағайындау дерегі)",
    verifiedAt: "2026-06-08",
    confidence: "partial",
    info:
      "Шымкент қаласы Еңбекші ауданына қарасты «Имам Ағзам» мешітіне Бахытжанұлы Нұрлан бас имам болып тағайындалғаны туралы ашық мақала бар.",
    note: "Имам дерегі тағайындау мақаласынан алынды; қазіргі мәртебесін мешіттен нақтылаған дұрыс.",
    sources: [
      {
        title: "Шымкент орталық мешіті: «Имам Ағзам» мешітіне жаңа имам тағайындалды",
        url: "https://iman.kz/archives/10606",
      },
      {
        title: "Yandex Maps: Имам Ағзам",
        url: "https://yandex.md/maps/org/mechet_imam_agzam/61638410784/",
      },
    ],
  },
  "70000001026611403": {
    verifiedAt: "2026-06-08",
    confidence: "partial",
    info:
      "Медресе жанындағы екі қабатты «Оразкүл ана» мешіті. Ашық сипаттамада жалпы көлемі 540 м2 екені және намаз оқу залы, кеңсе бөлмелері, асхана, дәретхана бар екені көрсетілген.",
    sources: [
      {
        title: "Қаттани мешіті: Шымкент медресесі және Оразкүл ана мешіті",
        url: "https://kattani.kz/p_1024/",
      },
      {
        title: "Yandex Maps: Оразкул Ана",
        url: "https://yandex.md/maps/org/orazkul_ana/141695747854/",
      },
    ],
  },
  "70000001028128961": {
    phone: "+7 (705) 326-40-37",
    verifiedAt: "2026-06-08",
    confidence: "partial",
    info:
      "Тәжібай ата мешіті бойынша ашық карта дерегінде телефон нөмірі және тәулік бойы жұмыс істейтіні көрсетілген.",
    sources: [
      {
        title: "Yandex Maps: Тәжібай ата мешіті",
        url: "https://yandex.kz/maps/org/tazhibay_ata_meshiti/52963381584/",
      },
    ],
  },
  "70000001064054184": {
    verifiedAt: "2026-06-08",
    confidence: "partial",
    info:
      "Әбу Бәкір Сыддық мешіті бойынша HalalGuide дерегінде Мамытов көшесі, 16/2 мекенжайы және 07:00-22:00 жұмыс уақыты көрсетілген.",
    sources: [
      {
        title: "HalalGuide: АБУ БАКР АС-СЫДДЫК",
        url: "https://halalguide.me/shymkent/mechet/ABU-BAKR-AS-SYDDYK",
      },
    ],
  },
  "70000001028336683": {
    verifiedAt: "2026-06-08",
    confidence: "map_only",
    info:
      "Аль Бируни мешіті бойынша ашық карта дерегінде Саттарханова көшесі, 34/1 мекенжайы көрсетілген. Жеке телефон немесе имам аты ашық деректе табылмады.",
    sources: [
      {
        title: "2GIS: Аль Бируни",
        url: "https://2gis.kz/shymkent/firm/70000001028336683",
      },
    ],
  },
  "70000001026542026": {
    verifiedAt: "2026-06-08",
    confidence: "map_only",
    info:
      "Дауытұлы Шынғысбай қажы мешіті бойынша HalalGuide дерегінде Иманов көшесі, 68/2 мекенжайы көрсетілген. Жеке телефон немесе имам аты сенімді ашық деректе табылмады.",
    sources: [
      {
        title: "HalalGuide: Дауытұлы Шынғысбай қажы",
        url: "https://halalguide.me/shymkent/mechet/Dauytuly-Shyngysbay-kazhy",
      },
    ],
  },
  "70000001028335766": {
    verifiedAt: "2026-06-08",
    confidence: "map_only",
    info:
      "Назармет ата мешіті бойынша ашық карта дерегінде мекенжай көрсетілген, бірақ жеке телефон және имам аты ашық деректе табылмады.",
    sources: [
      {
        title: "Yandex Maps: Назармат ата",
        url: "https://yandex.md/maps/org/mechet_nazarmat_ata/122083170666/",
      },
    ],
  },
  "70000001067973422": {
    phone: "+7 (7172) 24-77-17",
    verifiedAt: "2026-06-08",
    confidence: "partial",
    info:
      "Астана қаласындағы «Аль-Фаттах» мешіті. ҚМДБ жаңалығында мешіттің 500 адамға арналғаны, дәріс залы, имам бөлмесі және Құран оқу залы бар екені көрсетілген.",
    sources: [
      {
        title: "Yandex Maps: Аль-Фаттах телефоны",
        url: "https://yandex.kz/maps/org/al_fattah/18678043650/",
      },
      {
        title: "ҚМДБ: Астанеде новая мечеть «Аль-Фаттах»",
        url: "https://www.muftyat.kz/ru/news/qmdb/2023-02-10/41369-v-astane-otkrylas-novaia-mechet-foto/",
      },
    ],
  },
  "70000001018105093": {
    verifiedAt: "2026-06-08",
    confidence: "verified",
    info:
      "Астанадағы «Әзірет Сұлтан» соборлық мешіті 2012 жылғы 6 шілдеде ашылған. Ашық ресми деректерде мешіттің қазақ ою-өрнектері қолданылған классикалық ислам стилінде салынғаны және мереке күндері 10 мың адамға дейін қабылдай алатыны көрсетіледі.",
    note: "Имам аты мен тікелей байланыс нөмірі бұл карточкада әлі ресми түрде расталмаған; маршрут пен мекенжай 2GIS дерегінен алынады.",
    sources: [
      {
        title: "Akorda: Khazret Sultan Cathedral Mosque ашылуы",
        url: "https://akorda.kz/en/events/astana_kazakhstan/participation_in_events/today-president-nursultan-nazarbayev-unveils-new-khazret-sultan-cathedral-mosque_1342530562",
      },
      {
        title: "Invest Astana: «Әзірет Сұлтан» мешіті",
        url: "https://investastana.kz/kz/business-and-live/staying-in-the-city/%C2%ABaziret-sultan%C2%BB-meshiti/",
      },
      {
        title: "2GIS: Әзірет Сұлтан мешіті",
        url: "https://2gis.kz/firm/70000001018105093",
      },
    ],
  },
  "70000001033020386": {
    verifiedAt: "2026-06-08",
    confidence: "map_only",
    info:
      "Ақтөбедегі орталық қалалық мешіт. Қолданбада мекенжай мен маршрут 2GIS каталогынан көрсетіледі; имам аты, телефон және фото әлі ресми дереккөзбен расталмаған.",
    sources: [
      {
        title: "2GIS: Ақтөбе орталық қалалық мешіті",
        url: "https://2gis.kz/firm/70000001033020386",
      },
    ],
  },
  "70000001045840874": {
    verifiedAt: "2026-06-08",
    confidence: "map_only",
    info:
      "Алматы облысы бойынша 2GIS каталогында «Центральная мечеть» ретінде көрсетілген мешіт. Имам/телефон/photo дерегі ресми source-пен расталғанша карточка карта дерегі ретінде белгіленеді.",
    sources: [
      {
        title: "2GIS: Центральная мечеть",
        url: "https://2gis.kz/firm/70000001045840874",
      },
    ],
  },
  "70000001035238965": {
    verifiedAt: "2026-06-08",
    confidence: "map_only",
    info:
      "Астанадағы Aq meshit. Қолданбада картадағы мекенжай мен маршрут көрсетіледі; имам аты және байланыс нөмірі ресми дереккөзбен әлі расталмаған.",
    sources: [
      {
        title: "2GIS: Aq meshit",
        url: "https://2gis.kz/firm/70000001035238965",
      },
    ],
  },
  "70000001022982539": {
    verifiedAt: "2026-06-08",
    confidence: "map_only",
    info:
      "Астанадағы As-Salam мешіті. Имам/телефон/photo өрістері ресми source-пен толық расталғанша карточкада «карта дерегі ғана» күйі көрсетіледі.",
    sources: [
      {
        title: "2GIS: As-Salam мешіті",
        url: "https://2gis.kz/firm/70000001022982539",
      },
    ],
  },
};

export function mosqueDetailForId(id: string): MosqueDetailEnrichment | null {
  return MOSQUE_DETAILS_BY_2GIS_ID[id] ?? null;
}

function firstNonEmpty(...values: Array<string | undefined | null>): string | undefined {
  return values.map((v) => v?.trim()).find((v): v is string => Boolean(v));
}

function uniqNonEmpty(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw?.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function sourceTitleForUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) return "Instagram парақшасы";
    if (host.includes("facebook.com")) return "Facebook парақшасы";
    if (host.includes("muftyat.kz")) return "ҚМДБ / muftyat.kz";
    return `Сайт: ${host}`;
  } catch {
    return "Қосымша дереккөз";
  }
}

export function mosqueDetailForMosque(mosque: MosqueDetailFallbackInput): MosqueDetailEnrichment {
  const explicit = mosqueDetailForId(mosque.id);
  if (explicit) return explicit;
  const place = [mosque.fullAddress || mosque.address, mosque.regionName].filter(Boolean).join(", ");
  const phone = firstNonEmpty(mosque.phone, ...(mosque.contactPhones ?? []));
  const websites = uniqNonEmpty(mosque.websites ?? []);
  const socialUrls = uniqNonEmpty(mosque.socialUrls ?? []);
  const hasCatalogExtra = Boolean(phone || websites.length || socialUrls.length || mosque.scheduleText || mosque.photoUrl);
  const sources: MosqueDetailSource[] = [
    {
      title: `2GIS: ${mosque.name}`,
      url: mosque.mapUrl || `https://2gis.kz/firm/${mosque.id}`,
    },
    ...websites.map((url) => ({ title: sourceTitleForUrl(url), url })),
    ...socialUrls.map((url) => ({ title: sourceTitleForUrl(url), url })),
  ];

  return {
    verifiedAt: DEFAULT_2GIS_CATALOG_DATE,
    confidence: hasCatalogExtra ? "partial" : "map_only",
    phone,
    photoUrl: mosque.photoUrl,
    website: websites[0],
    socialUrls,
    scheduleText: mosque.scheduleText,
    info:
      `${mosque.name}${place ? ` (${place})` : ""} бойынша 2GIS каталогындағы атау, мекенжай және маршрут көрсетіледі. ` +
      (hasCatalogExtra
        ? "Каталогта табылған қосымша байланыс/сайт/жұмыс уақыты карточкада бөлек көрсетіледі. Имам аты ресми дереккөзбен расталғанда қосылады."
        : "Имам аты, телефон және фото ресми дереккөзбен расталғанда бөлек қосылады."),
    sources,
  };
}
