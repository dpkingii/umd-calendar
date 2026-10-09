"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { Customizer } from "@/components/customizer";
import { Timeline } from "@/components/timeline";
import {
  DEFAULTS,
  daysUntil,
  feedLinks,
  fmtDay,
  parseSettings,
  toEvents,
  toParams,
  upcoming,
  type ApiEvent,
  type CalEvent,
  type Settings,
} from "@/lib/calendar";

function Countdown({ next, now }: { next: CalEvent; now: Date }) {
  const days = daysUntil(next, now);
  const range = next.s.getTime() === next.e.getTime() ? fmtDay(next.s) : `${fmtDay(next.s)} – ${fmtDay(next.e)}`;
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-baseline gap-1.5">
        <span className="text-7xl leading-none font-extrabold tracking-tight text-brand">{days > 0 ? days : "Now"}</span>
        {days > 0 && <span className="text-lg font-semibold">{days === 1 ? "day" : "days"}</span>}
      </div>
      <div className="mt-1.5 font-semibold">{days > 0 ? `until ${next.title}` : next.title}</div>
      <div className="text-sm text-muted-foreground">{range}</div>
    </div>
  );
}

export default function Home() {
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [edited, setEdited] = useState<Settings | null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [failed, setFailed] = useState(false);

  const settings = edited ?? (ready ? parseSettings(window.location.search) : DEFAULTS);
  const now = useMemo(() => (ready ? new Date() : null), [ready]);

  useEffect(() => {
    fetch("/api/events.json")
      .then((r) => (r.ok ? (r.json() as Promise<ApiEvent[]>) : Promise.reject()))
      .then((data) => setEvents(toEvents(data)))
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (edited) window.history.replaceState(null, "", "?" + toParams(edited));
  }, [edited]);

  const links = useMemo(() => (ready ? feedLinks(window.location.origin, settings) : null), [ready, settings]);
  const rows = useMemo(() => (now ? upcoming(events, settings, now) : []), [events, settings, now]);
  const next = rows.find((e) => e.category === "break" || e.category === "finals") ?? rows[0];

  return (
    <div className="min-h-screen">
      <header className="px-4 pt-14 pb-10">
        <div className="mx-auto grid max-w-[1040px] items-center gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="text-xs font-bold tracking-[0.14em] text-brand uppercase">University of Maryland</div>
            <h1 className="mt-2 mb-3 text-5xl leading-none font-bold tracking-tight md:text-6xl">
              Never miss a break again.
            </h1>
            <p className="max-w-[30em] text-muted-foreground">
              Subscribe once. Breaks, finals, and holidays show up in your calendar, with reminders set the way you like.
            </p>
          </div>
          {next && now && <Countdown next={next} now={now} />}
        </div>
      </header>

      <main className="mx-auto grid max-w-[1040px] gap-7 px-4 pb-16 md:grid-cols-[340px_1fr]">
        <Customizer settings={settings} onChange={setEdited} links={links} />
        {failed ? (
          <p className="text-muted-foreground">Couldn&apos;t load the calendar. Try again in a moment.</p>
        ) : (
          now && <Timeline events={rows} settings={settings} now={now} />
        )}
      </main>
    </div>
  );
}
