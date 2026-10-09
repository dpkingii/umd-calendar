import re
from dataclasses import dataclass
from datetime import date, datetime

import requests
from bs4 import BeautifulSoup

URL = "https://academiccatalog.umd.edu/about-university/academic-calendar/semester-calendar/"

CATEGORIES = ("break", "finals", "classes", "other")

DATE_RE =re.compile(r"([A-Z][a-z]+) (\d+)(?:\s*-\s*(?:([A-Z][a-z]+) )?(\d+))?")


@dataclass(frozen=True)
class Event:
    title: str
    term: str
    start: date
    end: date
    category: str


def categorize(title: str) -> str:
    t = title.lower()
    if "final exam" in t:
        return "finals"
    if any(k in t for k in ("break", "recess", "holiday")):
        return "break"
    if any(k in t for k in ("begin", "first day", "last day", "end")):
        return "classes"
    return "other"


def parse_dates(text: str, year: int) -> tuple[date, date]:
    m = DATE_RE.search(text)
    start_month, start_day, end_month, end_day = m.groups()
    start = datetime.strptime(f"{start_month} {start_day} {year}", "%B %d %Y").date()
    if end_day is None:
        return start, start
    end = datetime.strptime(f"{end_month or start_month} {end_day} {year}", "%B %d %Y").date()
    return start, end


def parse_calendar(html: str) -> list[Event]:
    soup = BeautifulSoup(html, "html.parser")
    for sup in soup.find_all("sup"):
        sup.decompose()
    events = []
    for heading in soup.select("#textcontainer h2"):
        term, _, year = (p.strip() for p in heading.get_text().partition("|"))
        table = heading.find_next_sibling("table")
        for row in table.select("tbody tr"):
            title, when = (td.get_text(" ", strip=True) for td in row.find_all("td"))
            start, end = parse_dates(when, int(year))
            events.append(Event(title, term, start, end, categorize(title)))
    return events


def fetch_events(url: str = URL) -> list[Event]:
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return parse_calendar(resp.text)
