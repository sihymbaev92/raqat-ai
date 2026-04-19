# -*- coding: utf-8 -*-
import math

from services.qibla_service import KAABA_LAT, KAABA_LON, calculate_qibla


def test_kaaba_to_self_points_to_kaaba():
    """Мәкке координатасында құбыла бұрышы мағыналы болуы керек."""
    a = calculate_qibla(KAABA_LAT, KAABA_LON)
    assert 0 <= a < 360


def test_shymkent_bearing_reasonable():
    """Шымкенттен Мәккеге шамамен батыс-оңтүстік-батыс бағыт."""
    lat, lon = 42.3, 69.6
    a = calculate_qibla(lat, lon)
    assert 200 < a < 280


def test_calculate_qibla_is_deterministic():
    a1 = calculate_qibla(51.1, 71.4)
    a2 = calculate_qibla(51.1, 71.4)
    assert math.isclose(a1, a2)
