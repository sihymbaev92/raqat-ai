# -*- coding: utf-8 -*-
"""GET /api/v1/weather/current — tokenless Open-Meteo proxy for app/web fallback."""
from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/v1/weather", tags=["weather"])
logger = logging.getLogger("raqat_platform_api.weather")

OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast"


def _open_meteo_params(latitude: float, longitude: float, legacy: bool = False) -> dict[str, str]:
    params = {
        "latitude": f"{latitude:.6f}",
        "longitude": f"{longitude:.6f}",
        "timezone": "auto",
    }
    if legacy:
        params["current_weather"] = "true"
    else:
        params["current"] = "temperature_2m,weather_code,is_day"
    return params


def _parse_current(payload: dict) -> dict | None:
    current = payload.get("current")
    if isinstance(current, dict) and isinstance(current.get("temperature_2m"), (int, float)):
        return {
            "tempC": float(current["temperature_2m"]),
            "wmoCode": int(current.get("weather_code") or 0),
            "isDay": current.get("is_day") == 1 if isinstance(current.get("is_day"), int) else None,
            "observedAt": current.get("time") if isinstance(current.get("time"), str) else None,
        }

    legacy = payload.get("current_weather")
    if isinstance(legacy, dict) and isinstance(legacy.get("temperature"), (int, float)):
        return {
            "tempC": float(legacy["temperature"]),
            "wmoCode": int(legacy.get("weathercode") or 0),
            "isDay": legacy.get("is_day") == 1 if isinstance(legacy.get("is_day"), int) else None,
            "observedAt": legacy.get("time") if isinstance(legacy.get("time"), str) else None,
        }
    return None


@router.get("/current")
def weather_current(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
) -> JSONResponse:
    try:
        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            for legacy in (False, True):
                response = client.get(OPEN_METEO_FORECAST, params=_open_meteo_params(latitude, longitude, legacy))
                if not response.is_success:
                    continue
                parsed = _parse_current(response.json())
                if parsed is not None:
                    return JSONResponse(
                        content={**parsed, "source": "open-meteo"},
                        headers={"Cache-Control": "public, max-age=300"},
                    )
    except httpx.HTTPError as exc:
        logger.warning("weather upstream error lat=%s lon=%s: %s", latitude, longitude, exc)
        raise HTTPException(status_code=502, detail={"error": "weather_upstream_unreachable"}) from exc

    raise HTTPException(status_code=502, detail={"error": "weather_current_unavailable"})
