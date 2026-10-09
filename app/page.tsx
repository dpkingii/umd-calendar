"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { CalendarDaysIcon } from "lucide-react";

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

const RING = 2 * Math.PI * 52;
const RING_DAYS = 60;

function Countdown({ next, now }: { next: CalEvent; now: Date }) {
  const days = daysUntil(next, now);
  const range = next.s.getTime() === next.e.getTime() ? fmtDay(next.s) : `${fmtDay(next.s)} – ${fmtDay(next.e)}`;
  return (
    <div className="flex items-center gap-4 border-b pb-5">
      <div className="relative size-20 shrink-0">
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
        <div className="leading-snug font-semibold">
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
  const next = rows.find((e) => e.category === "break" || e.category === "finals") ?? rows[0];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1040px] items-center gap-2.5 px-6">
          <CalendarDaysIcon className="size-6 text-brand" />
          <span className="text-lg font-medium">UMD Calendar</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1040px] px-6 py-8 md:grid-cols-[300px_1fr]">
        <Customizer
          settings={settings}
          onChange={setEdited}
          links={links}
          top={next && now ? <Countdown next={next} now={now} /> : null}
        />
        <div className="mt-8 md:mt-0 md:pl-10">
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
