import { syncAccountDataWithServerBidirectional } from "../accountSync";

jest.mock("../../storage/authTokens", () => ({
  getValidAccessToken: jest.fn(),
}));

jest.mock("../../storage/hatimProgress", () => ({
  syncHatimWithServerBidirectional: jest.fn(),
}));

jest.mock("../../storage/quranBookmarks", () => ({
  syncQuranBookmarksWithServerBidirectional: jest.fn(),
}));

const { getValidAccessToken } = jest.requireMock("../../storage/authTokens") as {
  getValidAccessToken: jest.Mock;
};
const { syncHatimWithServerBidirectional } = jest.requireMock("../../storage/hatimProgress") as {
  syncHatimWithServerBidirectional: jest.Mock;
};
const { syncQuranBookmarksWithServerBidirectional } = jest.requireMock("../../storage/quranBookmarks") as {
  syncQuranBookmarksWithServerBidirectional: jest.Mock;
};

describe("syncAccountDataWithServerBidirectional", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("no-ops without access token", async () => {
    getValidAccessToken.mockResolvedValue(null);
    await syncAccountDataWithServerBidirectional();
    expect(syncHatimWithServerBidirectional).not.toHaveBeenCalled();
    expect(syncQuranBookmarksWithServerBidirectional).not.toHaveBeenCalled();
  });

  it("syncs hatim and bookmarks when logged in", async () => {
    getValidAccessToken.mockResolvedValue("token");
    await syncAccountDataWithServerBidirectional();
    expect(syncHatimWithServerBidirectional).toHaveBeenCalledTimes(1);
    expect(syncQuranBookmarksWithServerBidirectional).toHaveBeenCalledTimes(1);
  });
});
