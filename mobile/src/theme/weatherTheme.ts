/** WMO коды + температура → түсті chip темасы. */
export type WeatherTheme = {
  iconColor: string;
  tempColor: string;
  gradient: [string, string];
  borderColor: string;
};

function warmSunny(tempC: number): WeatherTheme {
  const hot = tempC >= 28;
  return {
    iconColor: hot ? "#FF6B00" : "#F59E0B",
    tempColor: hot ? "#EA580C" : "#D97706",
    gradient: hot ? ["rgba(255, 180, 80, 0.92)", "rgba(255, 120, 40, 0.88)"] : ["rgba(255, 214, 120, 0.9)", "rgba(255, 168, 60, 0.86)"],
    borderColor: "rgba(255, 193, 70, 0.65)",
  };
}

function clearNight(): WeatherTheme {
  return {
    iconColor: "#C4B5FD",
    tempColor: "#EDE9FE",
    gradient: ["rgba(49, 46, 129, 0.9)", "rgba(30, 41, 59, 0.86)"],
    borderColor: "rgba(196, 181, 253, 0.62)",
  };
}

function dawnTheme(): WeatherTheme {
  return {
    iconColor: "#FDBA74",
    tempColor: "#FFF7ED",
    gradient: ["rgba(251, 146, 60, 0.9)", "rgba(56, 189, 248, 0.82)"],
    borderColor: "rgba(251, 191, 36, 0.72)",
  };
}

function observedHour(observedAt?: string): number {
  const m = String(observedAt || "").match(/T(\d{1,2}):/);
  if (m) return Number(m[1]);
  return new Date().getHours();
}

function isMorningLight(observedAt?: string): boolean {
  const h = observedHour(observedAt);
  return h >= 4 && h <= 8;
}

export function weatherThemeForWmo(
  wmoCode: number,
  tempC: number,
  isDark: boolean,
  opts?: { isDay?: boolean; observedAt?: string }
): WeatherTheme {
  if ((wmoCode === 0 || (wmoCode >= 1 && wmoCode <= 3)) && opts?.isDay === false) {
    return clearNight();
  }
  if ((wmoCode === 0 || (wmoCode >= 1 && wmoCode <= 3)) && isMorningLight(opts?.observedAt)) {
    return dawnTheme();
  }
  if (wmoCode === 0) return warmSunny(tempC);
  if (wmoCode >= 1 && wmoCode <= 3) {
    return {
      iconColor: "#38BDF8",
      tempColor: isDark ? "#7DD3FC" : "#0284C7",
      gradient: ["rgba(125, 211, 252, 0.88)", "rgba(56, 189, 248, 0.82)"],
      borderColor: "rgba(56, 189, 248, 0.55)",
    };
  }
  if (wmoCode === 45 || wmoCode === 48) {
    return {
      iconColor: "#94A3B8",
      tempColor: isDark ? "#CBD5E1" : "#64748B",
      gradient: ["rgba(203, 213, 225, 0.75)", "rgba(148, 163, 184, 0.7)"],
      borderColor: "rgba(148, 163, 184, 0.45)",
    };
  }
  if ((wmoCode >= 51 && wmoCode <= 67) || (wmoCode >= 80 && wmoCode <= 82)) {
    return {
      iconColor: "#3B82F6",
      tempColor: isDark ? "#93C5FD" : "#1D4ED8",
      gradient: ["rgba(96, 165, 250, 0.88)", "rgba(59, 130, 246, 0.84)"],
      borderColor: "rgba(59, 130, 246, 0.55)",
    };
  }
  if (wmoCode >= 71 && wmoCode <= 77) {
    return {
      iconColor: "#E0F2FE",
      tempColor: isDark ? "#F0F9FF" : "#0369A1",
      gradient: ["rgba(224, 242, 254, 0.92)", "rgba(186, 230, 253, 0.88)"],
      borderColor: "rgba(125, 211, 252, 0.55)",
    };
  }
  if (wmoCode >= 95 && wmoCode <= 99) {
    return {
      iconColor: "#C084FC",
      tempColor: isDark ? "#E9D5FF" : "#7E22CE",
      gradient: ["rgba(192, 132, 252, 0.82)", "rgba(124, 58, 237, 0.78)"],
      borderColor: "rgba(167, 139, 250, 0.55)",
    };
  }
  if (wmoCode >= 85 && wmoCode <= 86) {
    return {
      iconColor: "#BAE6FD",
      tempColor: isDark ? "#E0F2FE" : "#0C4A6E",
      gradient: ["rgba(186, 230, 253, 0.9)", "rgba(125, 211, 252, 0.85)"],
      borderColor: "rgba(56, 189, 248, 0.5)",
    };
  }
  return {
    iconColor: "#94A3B8",
    tempColor: isDark ? "#E2E8F0" : "#475569",
    gradient: ["rgba(203, 213, 225, 0.82)", "rgba(148, 163, 184, 0.78)"],
    borderColor: "rgba(148, 163, 184, 0.45)",
  };
}

/** Namaz hero (қараңғы фон) үстіндегі chip — сол тема, анық border. */
export function weatherThemeForHero(
  wmoCode: number,
  tempC: number,
  opts?: { isDay?: boolean; observedAt?: string }
): WeatherTheme {
  const base = weatherThemeForWmo(wmoCode, tempC, true, opts);
  return {
    ...base,
    borderColor: base.borderColor.replace("0.55", "0.85").replace("0.45", "0.75").replace("0.5", "0.8").replace("0.65", "0.85"),
  };
}
