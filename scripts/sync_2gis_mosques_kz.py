#!/usr/bin/env python3
"""2GIS Catalog API — Қазақстандағы барлық мешіттер (rubric 13374).

Шығыс: mobile/assets/bundled/mosques-2gis-kz.json

API кілті: DGIS_API_KEY env (demo — тек әзірлеу, rate limit бар).
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "mobile" / "assets" / "bundled" / "mosques-2gis-kz.json"
RUBRIC_MOSQUE = "13374"
PAGE_SIZE = 50
REGION_PAUSE_S = 0.12
PAGE_PAUSE_S = 0.08


def api_key() -> str:
    return (os.environ.get("DGIS_API_KEY") or os.environ.get("TWO_GIS_API_KEY") or "demo").strip()


def fetch_json(path: str, retries: int = 4) -> dict:
    url = "https://catalog.api.2gis.com" + path
    url += "&" if "?" in path else "?"
    url += urllib.parse.urlencode({"key": api_key(), "locale": "ru_KZ"})
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            code = (data.get("meta") or {}).get("code")
            if code and code != 200:
                err = (data.get("meta") or {}).get("error") or {}
                raise RuntimeError(f"2GIS {code}: {err.get('message', data)}")
            return data
        except Exception as e:
            last_err = e
            time.sleep(0.5 * (attempt + 1))
    raise last_err or RuntimeError("2GIS fetch failed")


def firm_id_from_item_id(item_id: str) -> str:
    return (item_id or "").split("_", 1)[0]


def map_url(firm_id: str, lon: float, lat: float) -> str:
    m = urllib.parse.quote(f"{lon},{lat}", safe="")
    return f"https://2gis.kz/firm/{firm_id}?m={m}/16"


def clean_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_url(value: object) -> str:
    url = clean_text(value)
    if not url:
        return ""
    if "@" in url and not url.startswith(("http://", "https://")):
        return ""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def uniq(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in values:
        value = clean_text(raw)
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(value)
    return out


def contact_value(contact: dict, keys: tuple[str, ...]) -> str:
    for key in keys:
        value = clean_text(contact.get(key))
        if value:
            return value
    values = contact.get("values")
    if isinstance(values, list):
        for item in values:
            if isinstance(item, dict):
                value = contact_value(item, keys)
                if value:
                    return value
            else:
                value = clean_text(item)
                if value:
                    return value
    return ""


def extract_contacts(item: dict) -> dict[str, list[str]]:
    phones: list[str] = []
    websites: list[str] = []
    social_urls: list[str] = []
    emails: list[str] = []
    groups = item.get("contact_groups") or []
    if not isinstance(groups, list):
        return {"phones": [], "websites": [], "socialUrls": [], "emails": []}

    for group in groups:
        if not isinstance(group, dict):
            continue
        contacts = group.get("contacts") or []
        if not isinstance(contacts, list):
            continue
        for contact in contacts:
            if not isinstance(contact, dict):
                continue
            ctype = clean_text(contact.get("type") or contact.get("name") or contact.get("subtype")).lower()
            value = contact_value(contact, ("value", "text", "print_text", "url", "href"))
            if not value:
                continue
            if "phone" in ctype or "тел" in ctype:
                phones.append(value)
            elif "mail" in ctype or "email" in ctype or "@" in value:
                emails.append(value)
            elif any(mark in value.lower() for mark in ("instagram.com", "facebook.com", "vk.com", "t.me/", "wa.me/")):
                url = normalize_url(value)
                if url:
                    social_urls.append(url)
            elif "site" in ctype or "web" in ctype or "." in value:
                url = normalize_url(value)
                if url:
                    websites.append(url)

    return {
        "phones": uniq(phones),
        "websites": uniq(websites),
        "socialUrls": uniq(social_urls),
        "emails": uniq(emails),
    }


def schedule_summary(schedule: object) -> str:
    if not isinstance(schedule, dict):
        return ""
    if schedule.get("is_24x7") is True:
        return "24/7"
    for key in ("description", "comment"):
        text = clean_text(schedule.get(key))
        if text:
            return text[:160]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    chunks: list[str] = []
    for day in days:
        data = schedule.get(day)
        if not isinstance(data, dict):
            continue
        hours = data.get("working_hours") or []
        if not isinstance(hours, list) or not hours:
            continue
        first = hours[0]
        if not isinstance(first, dict):
            continue
        start = clean_text(first.get("from"))
        end = clean_text(first.get("to"))
        if start and end:
            chunks.append(f"{day} {start}-{end}")
    return "; ".join(chunks[:3])[:160]


def load_regions() -> list[dict]:
    data = fetch_json("/2.0/region/list?country_code=kz")
    return data.get("result", {}).get("items") or []


def fetch_region_mosques(region_id: str) -> list[dict]:
    fields = urllib.parse.quote(
        ",".join(
            [
                "items.id",
                "items.name",
                "items.full_name",
                "items.address_name",
                "items.full_address_name",
                "items.point",
                "items.contact_groups",
                "items.schedule",
                "total",
            ]
        )
    )
    page = 1
    out: list[dict] = []
    while True:
        path = (
            f"/3.0/items?rubric_id={RUBRIC_MOSQUE}&region_id={region_id}"
            f"&page_size={PAGE_SIZE}&page={page}&fields={fields}"
        )
        data = fetch_json(path)
        result = data.get("result") or {}
        items = result.get("items") or []
        if not items:
            break
        for it in items:
            pt = it.get("point") or {}
            lat, lon = pt.get("lat"), pt.get("lon")
            if lat is None or lon is None:
                continue
            item_id = str(it.get("id") or "")
            firm_id = firm_id_from_item_id(item_id)
            name = (it.get("name") or it.get("full_name") or "").strip()
            if not name:
                continue
            contacts = extract_contacts(it)
            schedule_text = schedule_summary(it.get("schedule"))
            full_address = clean_text(it.get("full_address_name"))
            phone = contacts["phones"][0] if contacts["phones"] else ""
            out.append(
                {
                    "id": firm_id,
                    "dgisItemId": item_id,
                    "name": name,
                    "address": (it.get("address_name") or "").strip(),
                    **({"fullAddress": full_address} if full_address else {}),
                    "lat": float(lat),
                    "lon": float(lon),
                    "regionId": region_id,
                    "mapUrl": map_url(firm_id, float(lon), float(lat)),
                    **({"phone": phone} if phone else {}),
                    **({"contactPhones": contacts["phones"]} if contacts["phones"] else {}),
                    **({"websites": contacts["websites"]} if contacts["websites"] else {}),
                    **({"socialUrls": contacts["socialUrls"]} if contacts["socialUrls"] else {}),
                    **({"scheduleText": schedule_text} if schedule_text else {}),
                }
            )
        total = int(result.get("total") or 0)
        if page * PAGE_SIZE >= total or len(items) < PAGE_SIZE:
            break
        page += 1
        time.sleep(PAGE_PAUSE_S)
    return out


def main() -> int:
    import sys as _sys

    def log(msg: str) -> None:
        print(msg, flush=True)

    log(f"2GIS key: {'demo' if api_key() == 'demo' else 'custom'}")
    regions = load_regions()
    log(f"Regions in KZ: {len(regions)}")

    by_id: dict[str, dict] = {}
    region_names = {str(r["id"]): r.get("name", "") for r in regions}

    for i, reg in enumerate(regions):
        rid = str(reg["id"])
        rname = reg.get("name") or ""
        try:
            probe = fetch_json(
                f"/3.0/items?rubric_id={RUBRIC_MOSQUE}&region_id={rid}"
                f"&page_size=1&page=1&fields=total"
            )
            total = int((probe.get("result") or {}).get("total") or 0)
        except Exception as e:
            log(f"  skip region {rid} ({rname}): {e}")
            time.sleep(REGION_PAUSE_S)
            continue
        if total <= 0:
            continue
        log(f"[{i + 1}/{len(regions)}] {rname} ({rid}): {total} …")
        rows = fetch_region_mosques(rid)
        for row in rows:
            row["regionName"] = rname
            prev = by_id.get(row["id"])
            if prev is None or len(row.get("address") or "") > len(prev.get("address") or ""):
                by_id[row["id"]] = row
        time.sleep(REGION_PAUSE_S)

    mosques = sorted(by_id.values(), key=lambda x: (x.get("regionName", ""), x.get("name", "")))
    payload = {
        "source": "2gis",
        "rubricId": RUBRIC_MOSQUE,
        "country": "KZ",
        "syncedAt": datetime.now(timezone.utc).isoformat(),
        "count": len(mosques),
        "mosques": mosques,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"Saved {len(mosques)} mosques -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
