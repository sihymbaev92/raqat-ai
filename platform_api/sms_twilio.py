# -*- coding: utf-8 -*-
"""Twilio арқылы SMS (опционалды)."""
from __future__ import annotations

import base64
import os

import httpx


def twilio_sms_configured() -> bool:
    return bool(
        (os.getenv("TWILIO_ACCOUNT_SID") or "").strip()
        and (os.getenv("TWILIO_AUTH_TOKEN") or "").strip()
        and (os.getenv("TWILIO_FROM_NUMBER") or "").strip()
    )


def send_twilio_sms(to_e164: str, body: str) -> None:
    sid = (os.getenv("TWILIO_ACCOUNT_SID") or "").strip()
    token = (os.getenv("TWILIO_AUTH_TOKEN") or "").strip()
    from_num = (os.getenv("TWILIO_FROM_NUMBER") or "").strip()
    if not (sid and token and from_num):
        raise RuntimeError("Twilio not configured")

    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    auth = base64.b64encode(f"{sid}:{token}".encode()).decode()
    with httpx.Client(timeout=30.0) as client:
        r = client.post(
            url,
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"To": to_e164, "From": from_num, "Body": body},
        )
        if r.status_code >= 400:
            raise RuntimeError(f"Twilio HTTP {r.status_code}: {r.text[:400]}")
