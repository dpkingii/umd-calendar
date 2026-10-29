"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { CalendarDaysIcon } from "lucide-react";

import { Customize, Subscribe } from "@/components/customizer";
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

const RING = 2 * Math.PI * 52;
const RING_DAYS = 60;

function Countdown({ next, now }: { next: CalEvent; now: Date }) {
  const days = daysUntil(next, now);
  const range = next.s.getTime() === next.e.getTime() ? fmtDay(next.s) : `${fmtDay(next.s)} – ${fmtDay(next.e)}`;
  return (
    <div className="flex items-center gap-4">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx={60} cy={60} r={52} fill="none" strokeWidth={9} className="stroke-muted" />
          <circle
            cx={60}
            cy={60}
            r={52}
            fill="none"
            strokeWidth={9}
            strokeLinecap="round"
            className="stroke-brand"
            strokeDasharray={RING}
            strokeDashoffset={RING * Math.min(Math.max(days, 0), RING_DAYS) / RING_DAYS}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl leading-none font-extrabold tracking-tight text-brand">{days > 0 ? days : "Now"}</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-lg leading-snug font-semibold">
          {days > 0 ? `${days === 1 ? "day" : "days"} until ${next.title}` : next.title}
        </div>
        <div className="text-sm text-muted-foreground">{range}</div>
      </div>
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
  const apple = ready && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  const next = rows.find((e) => e.category === "break" || e.category === "finals") ?? rows[0];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto grid max-w-[1040px] gap-10 px-6 py-8 md:grid-cols-[320px_1fr] md:gap-16 md:py-12">
        <aside className="space-y-6 md:sticky md:top-12 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto md:overscroll-contain">
          <h1 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarDaysIcon className="size-4 text-brand" aria-hidden />
            UMD Calendar
          </h1>
          {next && now && <Countdown next={next} now={now} />}
          <Subscribe links={links} apple={apple} />
          <Customize settings={settings} onChange={setEdited} />
        </aside>
        <div>
          {failed ? (
            <p className="text-muted-foreground">Couldn&apos;t load the calendar. Try again in a moment.</p>
          ) : (
            now && <Timeline events={rows} settings={settings} now={now} />
          )}
        </div>
      </main>
    </div>
  );
}
