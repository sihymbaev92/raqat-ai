import type { HalalDamuCompanyCard } from "../../api/halalDamuWp";
import * as halalDamuWp from "../../api/halalDamuWp";
import {
  companyToHalalProductItem,
  isHalalCertifiedCompany,
  resolveHalalProductBrowse,
  resolveHalalProductSearch,
} from "../halalProductSearch";

function mockCompany(partial: Partial<HalalDamuCompanyCard> & { id: number; title: string }): HalalDamuCompanyCard {
  return {
    id: partial.id,
    title: partial.title,
    slug: partial.slug ?? null,
    legalName: partial.legalName ?? null,
    categoryType: partial.categoryType ?? null,
    certificateStatus: partial.certificateStatus ?? "active",
    address: partial.address ?? null,
    phone: partial.phone ?? null,
    website: partial.website ?? null,
    mapLink: partial.mapLink ?? null,
    resolvedMapUrl: partial.resolvedMapUrl ?? null,
    updatedAt: partial.updatedAt ?? null,
    logoUrl: partial.logoUrl ?? null,
    thumbnailUrl: partial.thumbnailUrl ?? null,
    galleryUrls: partial.galleryUrls ?? [],
    phones: partial.phones ?? [],
    description: partial.description ?? null,
    certNumber: partial.certNumber ?? null,
    certIssuedAt: partial.certIssuedAt ?? null,
    certExpiresAt: partial.certExpiresAt ?? null,
    extraUrls: partial.extraUrls ?? [],
    lat: partial.lat ?? null,
    lon: partial.lon ?? null,
  };
}

describe("halalProductSearch", () => {
  it("isHalalCertifiedCompany rejects expired/revoked", () => {
    expect(isHalalCertifiedCompany(mockCompany({ id: 1, title: "A", certificateStatus: "active" }))).toBe(true);
    expect(isHalalCertifiedCompany(mockCompany({ id: 2, title: "B", certificateStatus: "expired" }))).toBe(false);
  });

  it("resolveHalalProductBrowse prefers seed when API empty", async () => {
    const spy = jest.spyOn(halalDamuWp, "fetchHalalDamuProductsBrowse").mockResolvedValue({ items: [] });
    const catalog = [mockCompany({ id: 7, title: "Halal Co", certificateStatus: "active" })];
    const out = await resolveHalalProductBrowse(catalog, { limit: 5 });
    expect(out.fromSeed).toBe(true);
    expect(out.fromProducers).toBe(false);
    expect(out.items.length).toBeGreaterThan(0);
    expect(out.items[0]?.fromRaqatSeed).toBe(true);
    expect(out.error).toBeUndefined();
    spy.mockRestore();
  });

  it("resolveHalalProductSearch does not surface API network error when seed hits", async () => {
    const spy = jest
      .spyOn(halalDamuWp, "searchHalalDamuProducts")
      .mockResolvedValue({ items: [], error: "network" });
    const out = await resolveHalalProductSearch("айран", [], { limit: 5 });
    expect(out.fromSeed).toBe(true);
    expect(out.items.length).toBeGreaterThan(0);
    expect(out.error).toBeUndefined();
    spy.mockRestore();
  });

  it("resolveHalalProductSearch falls back to certified producers from catalog", async () => {
    const spy = jest.spyOn(halalDamuWp, "searchHalalDamuProducts").mockResolvedValue({ items: [] });
    const catalog = [
      mockCompany({ id: 99, title: "UniqueHalalProducerXYZ", certificateStatus: "active" }),
      mockCompany({ id: 100, title: "Expired Dairy", certificateStatus: "expired" }),
    ];
    const out = await resolveHalalProductSearch("UniqueHalalProducerXYZ", catalog, { limit: 5 });
    expect(out.fromProducers).toBe(true);
    expect(out.fromSeed).toBeFalsy();
    expect(out.items.some((p) => p.companyId === 99 && p.fromCertifiedProducer)).toBe(true);
    expect(out.items.every((p) => p.companyId !== 100)).toBe(true);
    spy.mockRestore();
  });

  it("companyToHalalProductItem maps producer fallback fields", () => {
    const c = mockCompany({ id: 42, title: "«Восток-Молоко»", certificateStatus: "active" });
    const p = companyToHalalProductItem(c);
    expect(p.companyId).toBe(42);
    expect(p.fromCertifiedProducer).toBe(true);
    expect(p.verificationStatus).toBe("certified_producer");
    expect(p.certificateStatus).toBe("reference");
    expect(p.producerCertificateStatus).toBe("active");
    expect(p.title).toBe("«Восток-Молоко»");
  });
});
