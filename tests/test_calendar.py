from datetime import date
from pathlib import Path

from icalendar import Calendar

from build_ics import build_ics
from scrape import parse_calendar, parse_dates

HTML = (Path(__file__).parent / "catalog_fixture.html").read_text()


def by_title(events, title, term):
    return next(e for e in events if e.title == title and e.term == term)


def test_parses_all_terms():
    events = parse_calendar(HTML)
    assert {e.term for e in events} == {"Fall Semester", "Winter Term", "Spring Semester", "Summer Term"}
    assert len(events) == 27


def test_fall_break_range_and_category():
    e = by_title(parse_calendar(HTML), "Fall Break", "Fall Semester")
    assert (e.start, e.end, e.category) == (date(2026, 10, 12), date(2026, 10, 13), "break")


def test_single_month_range_and_single_day():
    assert parse_dates("December 14-21 (Monday-Monday)", 2026) == (date(2026, 12, 14), date(2026, 12, 21))
    assert parse_dates("August 31 (Monday)", 2026) == (date(2026, 8, 31), date(2026, 8, 31))


def test_footnote_markers_removed():
    titles = {e.title for e in parse_calendar(HTML)}
    assert "Commencement - Main Ceremony" in titles


def test_ics_event_is_all_day_with_alarms():
    cal = Calendar.from_ical(build_ics(parse_calendar(HTML)))
    vevents = [c for c in cal.walk("VEVENT") if c.get("summary") == "UMD: Fall Break"]
    assert len(vevents) == 1
    ev = vevents[0]
    assert ev.get("dtstart").dt == date(2026, 10, 12)
    assert ev.get("dtend").dt == date(2026, 10, 14)
    assert len(ev.walk("VALARM")) == 2


def test_uids_are_unique():
    cal = Calendar.from_ical(build_ics(parse_calendar(HTML)))
    uids = [str(c.get("uid")) for c in cal.walk("VEVENT")]
    assert len(uids) == len(set(uids))
