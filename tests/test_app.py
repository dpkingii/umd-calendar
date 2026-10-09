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
