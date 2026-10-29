import os
import re
import time
from datetime import date

import requests
from fastapi import FastAPI, HTTPException, Query, Request, Response

from build_ics import build_ics
from scrape import CATEGORIES, Event, fetch_events

TERMS = ("fall", "winter", "spring", "summer")
CACHE_SECONDS = 24 * 3600
SUB_PATTERN = re.compile(r"[A-Za-z0-9-]{8,40}")

app = FastAPI()
_cache: tuple[float, list[Event]] | None = None


def get_events() -> list[Event]:
    global _cache
    if _cache is None or time.time() - _cache[0] > CACHE_SECONDS:
        try:
            _cache = (time.time(), fetch_events())
        except requests.RequestException:
            raise HTTPException(502, "could not fetch the UMD calendar")
    return _cache[1]


def get_feed_events(base_url: str) -> list[Event]:
    # Every subscriber has a unique feed URL, so the CDN can't share cached feeds between them.
    # Reading the one CDN-cached events.json instead keeps scrapes to about one a day.
    if os.environ.get("VERCEL"):
        try:
            resp = requests.get(f"{base_url}api/events.json", timeout=5)
            resp.raise_for_status()
            return [
                Event(e["title"], e["term"], date.fromisoformat(e["start"]), date.fromisoformat(e["end"]), e["category"])
                for e in resp.json()
            ]
        except requests.RequestException:
            pass
    return get_events()


def parse_set(raw: str, allowed: tuple[str, ...], name: str) -> set[str]:
    values = {v for v in raw.split(",") if v}
    unknown = values - set(allowed)
    if unknown:
        raise HTTPException(422, f"unknown {name}: {sorted(unknown)}")
    return values


def parse_alerts(raw: str) -> tuple[int, ...]:
    try:
        days = {int(v) for v in raw.split(",") if v}
    except ValueError:
        raise HTTPException(422, "alerts must be comma-separated whole numbers")
    if len(days) > 6 or any(d < 0 or d > 60 for d in days):
        raise HTTPException(422, "alerts: at most 6 values, each 0-60 days")
    return tuple(sorted(days, reverse=True))


def record_hit(sub: str) -> None:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not SUB_PATTERN.fullmatch(sub):
        return
    # Counting is best-effort, a database problem must never break someone's calendar.
    # A repeat hit on the same day gets a 409 from the primary key, which is fine.
    try:
        requests.post(
            f"{url}/rest/v1/feed_hits",
            json={"sub": sub},
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Prefer": "return=minimal",
            },
            timeout=2,
        )
    except requests.RequestException:
        pass


@app.get("/api/events.json")
def events(response: Response) -> list[Event]:
    response.headers["Cache-Control"] = "public, s-maxage=86400"
    return get_events()


@app.get("/api/feed.ics")
def feed(
    request: Request,
    alerts: str = "7,1",
    hour: int = Query(9, ge=0, le=23),
    cats: str = ",".join(CATEGORIES),
    terms: str = ",".join(TERMS),
    sub: str = "",
) -> Response:
    record_hit(sub)
    alert_days = parse_alerts(alerts)
    wanted_cats = parse_set(cats, CATEGORIES, "category")
    wanted_terms = parse_set(terms, TERMS, "term")
    selected = [
        e
        for e in get_feed_events(str(request.base_url))
        if e.category in wanted_cats and e.term.split()[0].lower() in wanted_terms
    ]
    return Response(
        build_ics(selected, alert_days, hour),
        media_type="text/calendar",
        headers={"Cache-Control": "public, s-maxage=86400"},
    )

