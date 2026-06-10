/** «Дін мен дәстүр» — қазақы беж/қою қоңыр/алтын палитра (mockup стилі). */
export type TraditionKazakhPalette = {
  screenBg: string;
  cardBg: string;
  cardElevated: string;
  headerBg: string;
  headerText: string;
  headerSubtext: string;
  gold: string;
  goldMuted: string;
  goldSurface: string;
  brown: string;
  brownSoft: string;
  text: string;
  muted: string;
  border: string;
  bannerBg: string;
  bannerText: string;
  chipBg: string;
  chipActiveBg: string;
  chipText: string;
  chipActiveText: string;
  buttonGoldBg: string;
  buttonGoldText: string;
  buttonOutlineBorder: string;
  buttonOutlineText: string;
};

export function getTraditionKazakhPalette(isDark: boolean): TraditionKazakhPalette {
  if (isDark) {
    return {
      screenBg: "#14100C",
      cardBg: "#1E1812",
      cardElevated: "#2A2218",
      headerBg: "#1A1208",
      headerText: "#F5E6C8",
      headerSubtext: "rgba(245, 230, 200, 0.78)",
      gold: "#D4B84A",
      goldMuted: "#A8841A",
      goldSurface: "rgba(212, 184, 74, 0.14)",
      brown: "#3D2914",
      brownSoft: "#5C4030",
      text: "#F5EDE0",
      muted: "#B8A690",
      border: "rgba(212, 184, 74, 0.22)",
      bannerBg: "#1A3328",
      bannerText: "#E8D5A8",
      chipBg: "rgba(212, 184, 74, 0.1)",
      chipActiveBg: "rgba(212, 184, 74, 0.28)",
      chipText: "#C9B896",
      chipActiveText: "#F5E6C8",
      buttonGoldBg: "#C9A227",
      buttonGoldText: "#1A1208",
      buttonOutlineBorder: "#D4B84A",
      buttonOutlineText: "#D4B84A",
    };
  }
  return {
    screenBg: "#F5EDE0",
    cardBg: "#FFFBF4",
    cardElevated: "#FFFFFF",
    headerBg: "#2A1C0E",
    headerText: "#F5E6C8",
    headerSubtext: "rgba(245, 230, 200, 0.82)",
    gold: "#C9A227",
    goldMuted: "#A8841A",
    goldSurface: "rgba(201, 162, 39, 0.12)",
    brown: "#3D2914",
    brownSoft: "#5C4030",
    text: "#2A1C0E",
    muted: "#6B5A48",
    border: "#E0D4C0",
    bannerBg: "#1E3A2F",
    bannerText: "#E8D5A8",
    chipBg: "#F0E6D4",
    chipActiveBg: "rgba(201, 162, 39, 0.22)",
    chipText: "#5C4030",
    chipActiveText: "#2A1C0E",
    buttonGoldBg: "#C9A227",
    buttonGoldText: "#2A1C0E",
    buttonOutlineBorder: "#A8841A",
    buttonOutlineText: "#5C4030",
  };
}
