import { getQcf4UpstreamBaseUrl, mushafQcf4FontFileUrl } from "../config/mushafPagesBase";
import { qcf4FontFileName } from "../quran/qcf4FontLoader";

/** QCF4 Madinah mushaf — 47 бет қаріпі + бисмиллә (APK-да емес). */
export const QCF4_FONT_PACK_IDS: string[] = [
  ...Array.from({ length: 47 }, (_, i) => `QCF4_Hafs_${String(i + 1).padStart(2, "0")}`),
  "QCF4_QBSML",
];

export function qcf4FontPackTotalTasks(): number {
  return QCF4_FONT_PACK_IDS.length;
}

export function qcf4FontPackRemoteUrls(fontId: string): string[] {
  const file = qcf4FontFileName(fontId);
  return [`${getQcf4UpstreamBaseUrl()}/fonts/${file}`, mushafQcf4FontFileUrl(fontId, "ttf")];
}

export function qcf4FontPackTaskLabel(fontId: string): string {
  return fontId === "QCF4_QBSML" ? "Bismillah" : fontId.replace("QCF4_Hafs_", "Hafs ");
}
