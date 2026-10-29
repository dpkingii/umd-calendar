from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from icalendar import Calendar

import app as app_module
from scrape import parse_calendar

HTML = (Path(__file__).parent / "catalog_fixture.html").read_text()


@pytest.fixture
def client(monkeypatch):
    events = parse_calendar(HTML)
    monkeypatch.setattr(app_module, "get_events", lambda: events)
    return TestClient(app_module.app)


def vevents(resp):
    return list(Calendar.from_ical(resp.content).walk("VEVENT"))


def triggers(event):
    return sorted(a.get("trigger").dt for a in event.walk("VALARM"))


def fall_break(resp):
    return next(e for e in vevents(resp) if e.get("summary") == "UMD: Fall Break")


def test_default_feed(client):
    resp = client.get("/api/feed.ics")
    assert resp.headers["content-type"].startswith("text/calendar")
    assert len(vevents(resp)) == 27
    assert triggers(fall_break(resp)) == [timedelta(days=-7, hours=9), timedelta(days=-1, hours=9)]


def test_custom_alerts_and_hour(client):
    resp = client.get("/api/feed.ics", params={"alerts": "14,0", "hour": 8})
    assert triggers(fall_break(resp)) == [timedelta(days=-14, hours=8), timedelta(hours=8)]


def test_no_alerts(client):
    resp = client.get("/api/feed.ics", params={"alerts": ""})
    assert triggers(fall_break(resp)) == []


def test_category_filter(client):
    resp = client.get("/api/feed.ics", params={"cats": "finals"})
    assert {str(e.get("categories").cats[0]) for e in vevents(resp)} == {"finals"}


def test_term_filter(client):
    resp = client.get("/api/feed.ics", params={"terms": "winter"})
    assert len(vevents(resp)) == 3


@pytest.mark.parametrize(
    "params",
    [{"alerts": "abc"}, {"alerts": "61"}, {"alerts": "1,2,3,4,5,6,7"}, {"hour": 24}, {"cats": "nope"}, {"terms": "nope"}],
)
def test_invalid_params_rejected(client, params):
    assert client.get("/api/feed.ics", params=params).status_code == 422


@pytest.fixture
def posts(monkeypatch):
    calls = []
    monkeypatch.setenv("SUPABASE_URL", "https://db.example")
    monkeypatch.setenv("SUPABASE_KEY", "key")
    monkeypatch.setattr(app_module.requests, "post", lambda url, **kw: calls.append((url, kw["json"])))
    return calls


def test_feed_records_subscriber(client, posts):
    client.get("/api/feed.ics", params={"sub": "3f2b9c1e-0a4d-4e8f-9b7a-1c2d3e4f5a6b"})
    assert posts == [("https://db.example/rest/v1/feed_hits", {"sub": "3f2b9c1e-0a4d-4e8f-9b7a-1c2d3e4f5a6b"})]


@pytest.mark.parametrize("sub", ["", "short", "not valid!"])
def test_feed_skips_missing_or_bad_subscriber(client, posts, sub):
    client.get("/api/feed.ics", params={"sub": sub})
    assert posts == []


def test_feed_survives_database_errors(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://db.example")

    def fail(*args, **kwargs):
        raise app_module.requests.ConnectionError

    monkeypatch.setattr(app_module.requests, "post", fail)
    resp = client.get("/api/feed.ics", params={"sub": "3f2b9c1e-0a4d-4e8f-9b7a-1c2d3e4f5a6b"})
    assert resp.status_code == 200


class FakeResponse:
    def __init__(self, rows):
        self.rows = rows

    def raise_for_status(self):
        pass

    def json(self):
        return self.rows


def test_feed_reads_cached_events_json_on_vercel(client, monkeypatch):
    rows = client.get("/api/events.json").json()
    urls = []
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setattr(app_module, "get_events", lambda: pytest.fail("feed scraped instead of reading events.json"))
    monkeypatch.setattr(app_module.requests, "get", lambda url, **kw: urls.append(url) or FakeResponse(rows))
    resp = client.get("/api/feed.ics")
    assert urls == ["http://testserver/api/events.json"]
    assert len(vevents(resp)) == 27


def test_feed_falls_back_to_scraping_when_events_json_fails(client, monkeypatch):
    monkeypatch.setenv("VERCEL", "1")

    def fail(*args, **kwargs):
        raise app_module.requests.ConnectionError

    monkeypatch.setattr(app_module.requests, "get", fail)
    assert len(vevents(client.get("/api/feed.ics"))) == 27


def test_events_json(client):
    rows = client.get("/api/events.json").json()
    assert len(rows) == 27
    assert {
        "title": "Fall Break",
        "term": "Fall Semester",
        "start": "2026-10-12",
        "end": "2026-10-13",
        "category": "break",
    } in rows
