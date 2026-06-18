import type { HalalDamuCompanyCard } from "../halalDamuWp";
import {
  enrichHalalCompanyCardsFromBulkCache,
  halalCompanyDisplayImageUrl,
  halalDamuRemoteImageThumbnailUrl,
} from "../halalDamuWp";

function card(partial: Partial<HalalDamuCompanyCard> & Pick<HalalDamuCompanyCard, "id" | "title">): HalalDamuCompanyCard {
  return {
    id: partial.id,
    title: partial.title,
    legalName: null,
    slug: null,
    categoryType: null,
    certificateStatus: null,
    address: null,
    phone: null,
    website: null,
    mapLink: null,
    thumbnailUrl: partial.thumbnailUrl ?? null,
    updatedAt: null,
    logoUrl: partial.logoUrl ?? null,
    galleryUrls: partial.galleryUrls ?? [],
    phones: [],
    description: null,
    certNumber: null,
    certIssuedAt: null,
    certExpiresAt: null,
    lat: null,
    lon: null,
    resolvedMapUrl: null,
    extraUrls: [],
  };
}

describe("halalCompanyDisplayImageUrl", () => {
  it("prefers logo over thumbnail and gallery", () => {
    const c = card({
      id: 1,
      title: "A",
      logoUrl: "https://x/logo.png",
      thumbnailUrl: "https://x/thumb.png",
      galleryUrls: ["https://x/g1.png"],
    });
    expect(halalCompanyDisplayImageUrl(c)).toBe("https://x/logo.png");
  });

  it("falls back to gallery when logo missing", () => {
    const c = card({
      id: 2,
      title: "B",
      galleryUrls: ["https://x/g1.png"],
    });
    expect(halalCompanyDisplayImageUrl(c)).toBe("https://x/g1.png");
  });
});

describe("enrichHalalCompanyCardsFromBulkCache", () => {
  it("returns items unchanged when bulk cache empty", () => {
    const items = [card({ id: 3, title: "C" })];
    expect(enrichHalalCompanyCardsFromBulkCache(items)).toEqual(items);
  });
});

describe("halalDamuRemoteImageThumbnailUrl", () => {
  it("uses WordPress 300x300 upload candidate for full images", () => {
    expect(
      halalDamuRemoteImageThumbnailUrl("https://halaldamu.kz/wp-content/uploads/2026/06/product.png")
    ).toBe("https://halaldamu.kz/wp-content/uploads/2026/06/product-300x300.png");
  });

  it("keeps already-sized and non-upload URLs unchanged", () => {
    expect(
      halalDamuRemoteImageThumbnailUrl("https://halaldamu.kz/wp-content/uploads/2026/06/product-150x150.jpg")
    ).toBe("https://halaldamu.kz/wp-content/uploads/2026/06/product-150x150.jpg");
    expect(halalDamuRemoteImageThumbnailUrl("https://example.com/image.jpg")).toBe(
      "https://example.com/image.jpg"
    );
  });
});
