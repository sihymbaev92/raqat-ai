/**
 * Әр дерек жазбасы үшін түпнұсқа: қайдан алынғаны, дәлел, лицензия — RAQAT ішінде сақталады.
 */
export type DataProvenance = {
  /** Ресми дерек көзі атауы */
  origin: string;
  /** Бұл түпнұсқа RAQAT-та тіркелген күні (ISO 8601) */
  recordedAt: string;
  /** Лицензия немесе қолдану шарты (қысқаша) */
  licenseHint?: string;
  /** Дәлел: қандай факт/сілтеме қай көзден екенін растайды */
  evidenceKk: string;
  /** Растайтын сілтеме (API, құжат, сайт беті) */
  evidenceUrl?: string;
};

/** Каталог + API бір форматта; әр жазбада provenance міндетті */
export type InstitutionSource = {
  id: string;
  name: string;
  country?: string;
  type: "university" | "research" | "media" | "open_data" | "other";
  websiteUrl?: string;
  descriptionKk?: string;
  provenance: DataProvenance;
};

/** Дерек сапасы үшін метадерек (келешек API жауабы) */
export type DataAttribution = {
  sourceId: string;
  retrievedAt: string;
  license?: string;
};
