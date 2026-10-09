import time

import requests
from fastapi import FastAPI, HTTPException, Query, Response

from build_ics import build_ics
from scrape import CATEGORIES, Event, fetch_events

TERMS = ("fall", "winter", "spring", "summer")
CACHE_SECONDS = 6 * 3600

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


@app.get("/api/events.json")
def events() -> list[Event]:
    return get_events()


@app.get("/api/feed.ics")
def feed(
    alerts: str = "7,1",
    hour: int = Query(9, ge=0, le=23),
    cats: str = ",".join(CATEGORIES),
    terms: str = ",".join(TERMS),
) -> Response:
    alert_days = parse_alerts(alerts)
    wanted_cats = parse_set(cats, CATEGORIES, "category")
    wanted_terms = parse_set(terms, TERMS, "term")
    selected = [
        e
        for e in get_events()
        if e.category in wanted_cats and e.term.split()[0].lower() in wanted_terms
    ]
    return Response(
        build_ics(selected, alert_days, hour),
        media_type="text/calendar",
        headers={"Cache-Control": "public, s-maxage=21600"},
    )

