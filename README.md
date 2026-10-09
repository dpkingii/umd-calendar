# umd-calendar

A subscribable calendar of UMD academic dates (fall break, finals, holidays, term start/end) with reminders you configure.

A FastAPI app scrapes the [UMD Academic Catalog semester calendar](https://academiccatalog.umd.edu/about-university/academic-calendar/semester-calendar/) (cached 6 hours) and serves:

- `/` the customizer page (`public/index.html`)
- `/feed.ics` an RFC 5545 feed built from query params
- `/events.json` the parsed events

## Feed parameters

| param | default | meaning |
|---|---|---|
| `alerts` | `7,1` | days before each event to remind (0 = day of, empty = none, max 6 values, 0-60) |
| `hour` | `9` | hour of day (0-23) the reminder fires |
| `cats` | all | `break,finals,classes,other` |
| `terms` | all | `fall,winter,spring,summer` |

Example: `/feed.ics?alerts=14,3,0&hour=8&cats=break,finals`

## Subscribe

Open the site, pick your reminders, and use the buttons. Or paste a feed URL into Google Calendar (**Other calendars → From URL**) or Apple Calendar (**File → New Calendar Subscription**).

## Develop

```
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest
.venv/bin/uvicorn app:app --reload   # http://localhost:8000
```

The parser is tested against a saved copy of the page (`tests/catalog_fixture.html`).

## Backlog

- **Email reminders (opt-in):** signup form reusing the chosen settings, double opt-in confirmation, Supabase/Postgres subscriber table, daily Vercel Cron job that sends on each subscriber's lead-time days via Resend, one-click unsubscribe. Build locally with emails logged to the console first. Open question: lead-time days only, or also a weekly digest.
- Claude API fallback parser if the catalog page layout changes.

## Deploy

Import the repo into Vercel. It detects the FastAPI `app` in `app.py` and serves `public/` as static files, so no config is needed.
