import re
from datetime import datetime, timedelta, timezone

from icalendar import Alarm, Calendar, Event as IcsEvent

from scrape import Event


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def build_ics(events: list[Event], alert_days: tuple[int, ...] = (7, 1), hour: int = 9) -> bytes:
    cal = Calendar()
    cal.add("prodid", "-//umd-calendar//EN")
    cal.add("version", "2.0")
    cal.add("x-wr-calname", "UMD Academic Calendar")
    now = datetime.now(timezone.utc)
    for e in events:
        item = IcsEvent()
        item.add("uid", f"{slug(e.term)}-{slug(e.title)}-{e.start.isoformat()}@umd-calendar")
        item.add("summary", f"UMD: {e.title}")
        item.add("dtstart", e.start)
        item.add("dtend", e.end + timedelta(days=1))
        item.add("dtstamp", now)
        item.add("categories", [e.category])
        for days in alert_days:
            alarm = Alarm()
            alarm.add("action", "DISPLAY")
            alarm.add("description", f"{e.title} starts in {days} day{'s' if days != 1 else ''}" if days else f"{e.title} is today")
            alarm.add("trigger", timedelta(days=-days, hours=hour))
            item.add_component(alarm)
        cal.add_component(item)
    return cal.to_ical()
