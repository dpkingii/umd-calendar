# umd-calendar

A subscribable calendar of UMD academic dates (fall break, finals, holidays, term start/end) with reminders you configure.

- **Frontend:** Next.js + Tailwind + [shadcn/ui](https://ui.shadcn.com) (`app/`, `components/`, `lib/`)
- **Backend:** FastAPI (`app.py`, `scrape.py`, `build_ics.py`), served on Vercel via `api/index.py`

The API scrapes the [UMD Academic Catalog semester calendar](https://academiccatalog.umd.edu/about-university/academic-calendar/semester-calendar/) (cached 6 hours) and serves:

- `/api/feed.ics` an RFC 5545 feed built from query params
- `/api/events.json` the parsed events

## Feed parameters

| param | default | meaning |
|---|---|---|
| `alerts` | `7,1` | days before each event to remind (0 = day of, empty = none, max 6 values, 0-60) |
| `hour` | `9` | hour of day (0-23) the reminder fires |
| `cats` | all | `break,finals,classes,other` |
| `terms` | all | `fall,winter,spring,summer` |

Example: `/api/feed.ics?alerts=14,3,0&hour=8&cats=break,finals`

## Subscribe

Open the site, pick your reminders, and use the buttons. Or paste a feed URL into Google Calendar (**Other calendars → From URL**) or Apple Calendar (**File → New Calendar Subscription**).

## Develop

Run the API and the web app side by side. In development, Next proxies `/api/*` to the API on port 8000.

```
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
npm install

.venv/bin/uvicorn app:app --reload --port 8000   # terminal 1
npm run dev                                      # terminal 2, http://localhost:3000
```

Tests and checks:

```
.venv/bin/python -m pytest   # parser, ICS, and API
npm run lint && npm run build
```

The parser is tested against a saved copy of the page (`tests/catalog_fixture.html`).

## Backlog

- **Email reminders (opt-in):** signup form reusing the chosen settings, double opt-in confirmation, Supabase/Postgres subscriber table, daily Vercel Cron job that sends on each subscriber's lead-time days via Resend, one-click unsubscribe. Build locally with emails logged to the console first. Open question: lead-time days only, or also a weekly digest.
- Claude API fallback parser if the catalog page layout changes.

## Deploy

Import the repo into Vercel. It builds the Next.js app and runs `api/index.py` as a Python function; `vercel.json` rewrites `/api/*` to it. Not yet deployed or tested on Vercel.
