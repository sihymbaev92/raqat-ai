import { isInsideMoreStackNavigator, navigateToMoreStackScreen, navigateToQuranSurah } from "../navigateToMoreStack";
import { rootNavigationRef } from "../rootNavigationRef";
import { CommonActions } from "@react-navigation/native";
import { mushafPageForSurahAyah } from "../../quran/mushafPageForSurahAyah";

jest.mock("../rootNavigationRef", () => ({
  rootNavigationRef: {
    isReady: jest.fn(),
    navigate: jest.fn(),
    dispatch: jest.fn(),
    getRootState: jest.fn(),
  },
}));

const rootRef = rootNavigationRef as jest.Mocked<typeof rootNavigationRef>;

describe("navigateToMoreStackScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rootRef.isReady.mockReturnValue(true);
  });

  it("navigates via root ref from dashboard-like tab navigator", () => {
    const navigation = {
      navigate: jest.fn(),
      dispatch: jest.fn(),
      getParent: jest.fn(),
      getState: () => ({ routeNames: ["Home", "Duas", "Tasbih"] }),
    };

    navigateToMoreStackScreen("NamazGuide", undefined, navigation);

    expect(rootRef.navigate).toHaveBeenCalledWith("MoreStack", { screen: "NamazGuide" });
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it("navigates to Hatim via root ref", () => {
    const navigation = {
      navigate: jest.fn(),
      dispatch: jest.fn(),
      getParent: jest.fn(),
      getState: () => ({ routeNames: ["Home", "Duas", "Tasbih"] }),
    };

    navigateToMoreStackScreen("Hatim", undefined, navigation);

    expect(rootRef.navigate).toHaveBeenCalledWith("MoreStack", { screen: "Hatim" });
  });

  it("opens mushaf QuranSurah requests on the exact Hafs page via root", () => {
    const navigation = {
      navigate: jest.fn(),
      dispatch: jest.fn(),
      getParent: jest.fn(),
      getState: () => ({ routeNames: ["Home", "Duas", "Tasbih"] }),
    };

    navigateToQuranSurah(
      { surahNumber: 2, englishName: "Әл-Бақара", mushafLayout: true },
      navigation
    );

    expect(rootRef.navigate).toHaveBeenCalledWith("MoreStack", {
      screen: "QuranMushafBook",
      params: {
        focusSurah: 2,
        focusAyah: 1,
        initialPage: mushafPageForSurahAyah(2, 1),
        continuousMushaf: true,
      },
    });
  });

  it("opens mushaf topic-search ayah on the exact Hafs page", () => {
    const navigation = {
      navigate: jest.fn(),
      dispatch: jest.fn(),
      getState: () => ({ routeNames: ["QuranList", "Hatim", "ContentHub"] }),
    };

    navigateToQuranSurah({ surahNumber: 2, initialAyah: 255, mushafLayout: true }, navigation);

    expect(navigation.navigate).toHaveBeenCalledWith("QuranMushafBook", {
      focusSurah: 2,
      focusAyah: 255,
      initialPage: mushafPageForSurahAyah(2, 255),
      continuousMushaf: true,
    });
  });

  it("opens mushaf QuranSurah requests inside MoreStack on the exact Hafs page", () => {
    const navigation = {
      navigate: jest.fn(),
      dispatch: jest.fn(),
      getState: () => ({ routeNames: ["QuranList", "Hatim", "ContentHub"] }),
    };

    navigateToQuranSurah({ surahNumber: 1, mushafLayout: true }, navigation);

    expect(navigation.navigate).toHaveBeenCalledWith("QuranMushafBook", {
      focusSurah: 1,
      focusAyah: 1,
      initialPage: mushafPageForSurahAyah(1, 1),
      continuousMushaf: true,
    });
    expect(rootRef.navigate).not.toHaveBeenCalled();
  });

  it("falls back to parent dispatch when root ref is not ready", () => {
    rootRef.isReady.mockReturnValue(false);
    const parent = { navigate: jest.fn(), dispatch: jest.fn(), getParent: jest.fn() };
    const navigation = {
      navigate: jest.fn(),
      dispatch: jest.fn(),
      getParent: () => parent,
      getState: () => ({ routeNames: ["Home", "Duas", "Tasbih"] }),
    };

    navigateToMoreStackScreen("NamazGuide", undefined, navigation);

    expect(parent.dispatch).toHaveBeenCalledWith(
      CommonActions.navigate({
        name: "MoreStack",
        params: { screen: "NamazGuide" },
      })
    );
  });

  it("navigates directly when already inside MoreStack", () => {
    const navigation = {
      navigate: jest.fn(),
      dispatch: jest.fn(),
      getState: () => ({ routeNames: ["ContentHub", "NamazGuide", "QuranList"] }),
    };

    navigateToMoreStackScreen("NamazGuide", undefined, navigation);

    expect(navigation.navigate).toHaveBeenCalledWith("NamazGuide");
    expect(rootRef.dispatch).not.toHaveBeenCalled();
  });
});

describe("isInsideMoreStackNavigator", () => {
  it("returns true when routeNames include a MoreStack screen", () => {
    expect(
      isInsideMoreStackNavigator({
        navigate: jest.fn(),
        dispatch: jest.fn(),
        getState: () => ({ routeNames: ["ContentHub", "NamazGuide", "QuranList"] }),
      })
    ).toBe(true);
    expect(
      isInsideMoreStackNavigator({
        navigate: jest.fn(),
        dispatch: jest.fn(),
        getState: () => ({ routeNames: ["QuranList", "QuranSurah", "Hatim"] }),
      })
    ).toBe(true);
  });

  it("returns false for main tab navigator", () => {
    expect(
      isInsideMoreStackNavigator({
        navigate: jest.fn(),
        dispatch: jest.fn(),
        getState: () => ({ routeNames: ["Home", "Duas", "Tasbih"] }),
      })
    ).toBe(false);
  });
});
