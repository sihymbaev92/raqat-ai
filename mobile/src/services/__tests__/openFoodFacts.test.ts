import { fetchProductByBarcode, fetchProductByBarcodeSmart, formatOpenFoodFactsForHalal } from "../openFoodFacts";

function okJson(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  };
}

describe("openFoodFacts service", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout").mockImplementation(((cb: (...args: unknown[]) => void) => {
      cb();
      return 0;
    }) as typeof setTimeout);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("fetchProductByBarcode өнім табылғанда hit қайтарады", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      okJson({
        status: 1,
        product: {
          product_name: "Test Product",
          brands: "Brand",
          ingredients_text: "water, sugar",
        },
      })
    );
    (global as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchProductByBarcode("5449000000996");
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.productName).toBe("Test Product");
      expect(result.ingredients).toContain("water");
    }
  });

  it("fetchProductByBarcodeSmart келесі candidate-ке өтеді", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(okJson({ status: 0 }))
      .mockResolvedValueOnce(okJson({ status: 0 }))
      .mockResolvedValueOnce(
        okJson({
          status: 1,
          product: {
            product_name: "UPC Converted",
            ingredients_text: "salt",
          },
        })
      );
    (global as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchProductByBarcodeSmart("012345678905");
    expect(result.found).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain("/product/012345678905.json");
    expect(fetchMock.mock.calls[1][0]).toContain("/product/012345678905.json");
    expect(fetchMock.mock.calls[2][0]).toContain("/product/0012345678905.json");
  });

  it("форматтаушы hit-ті оқуға ыңғайлы блокқа айналдырады", () => {
    const block = formatOpenFoodFactsForHalal({
      found: true,
      code: "123",
      productName: "X",
      brands: "Y",
      ingredients: "A, B",
    });
    expect(block).toContain("Штрихкод: 123");
    expect(block).toContain("Өнім: X");
    expect(block).toContain("Құрам");
  });
});
