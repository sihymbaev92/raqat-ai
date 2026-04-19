# -*- coding: utf-8 -*-
import math

KAABA_LAT = 21.4225
KAABA_LON = 39.8262

# 16 бағыт: ағылшын қысқартулары + қазақша
WINDS_16 = [
    (0, "↑", "N", "Солтүстік"),
    (22.5, "↗", "NNE", "Солт.-солтүстік-шығыс"),
    (45, "↗", "NE", "Солтүстік-шығыс"),
    (67.5, "↗", "ENE", "Шығыс-солтүстік-шығыс"),
    (90, "→", "E", "Шығыс"),
    (112.5, "↘", "ESE", "Оңтүстік-шығыс-шығыс"),
    (135, "↘", "SE", "Оңтүстік-шығыс"),
    (157.5, "↘", "SSE", "Оңтүстік-оңтүстік-шығыс"),
    (180, "↓", "S", "Оңтүстік"),
    (202.5, "↙", "SSW", "Оңтүстік-оңтүстік-батыс"),
    (225, "↙", "SW", "Оңтүстік-батыс"),
    (247.5, "↙", "WSW", "Батыс-оңтүстік-батыс"),
    (270, "←", "W", "Батыс"),
    (292.5, "↖", "WNW", "Солтүстік-батыс-батыс"),
    (315, "↖", "NW", "Солтүстік-батыс"),
    (337.5, "↖", "NNW", "Солтүстік-солтүстік-батыс"),
]


def calculate_qibla(lat: float, lon: float) -> float:
    lat1, lon1 = math.radians(lat), math.radians(lon)
    lat2, lon2 = math.radians(KAABA_LAT), math.radians(KAABA_LON)
    dlon = lon2 - lon1
    y = math.sin(dlon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def compass_arrow_16(angle: float) -> tuple[str, str, str]:
    """Құбыла бұрышына сәйкес 16 нүктелі компас: белгіше, EN код, қазақша сипат."""
    a = angle % 360
    idx = int((a + 11.25) / 22.5) % 16
    _, sym, en, kk = WINDS_16[idx]
    return sym, en, kk


def compass_arrow(angle: float) -> tuple[str, str]:
    """8 бағытқа үйлесімді (eski API)."""
    sym, _en, kk = compass_arrow_16(angle)
    return sym, kk


def format_qibla_compass(angle: float) -> str:
    """Толық компас: NESW тор + дәл бұрыш + бағыт."""
    sym, _en, label_kk = compass_arrow_16(angle)
    a = angle % 360

    # Тор: құбыла бағыты орталықтан сағат тілімен a бұрышта
    # Көрнекі: сыртқы сақинадағы белгіше
    ring = (
        "        N\n"
        "         |\n"
        "    W ---+--- E\n"
        "         |\n"
        "        S"
    )
    precision = (
        f"📐 <b>Құбыла бұрышы:</b> <code>{a:.2f}°</code> (сағат тілімен солтүстікден)\n"
        f"🧭 <b>Негізгі бағыт:</b> {sym} <i>{label_kk}</i>"
    )
    return f"{ring}\n\n{precision}"
