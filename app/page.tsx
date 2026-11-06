"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import Link from "next/link";
import { BellIcon, CalendarIcon, ChevronDownIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";

import { Customize, Subscribe } from "@/components/customizer";
import { DOT, Timeline, TimelineSkeleton } from "@/components/timeline";
import {
  CATS,
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
import { cn } from "@/lib/utils";

const GITHUB = "https://github.com/dpkingii/umd-calendar";
const CATALOG = "https://academiccatalog.umd.edu/about-university/academic-calendar/semester-calendar/";
const WIDTH = "mx-auto w-full max-w-[1120px] px-6";
const NAV_LINK = "transition-[color] duration-150 ease-out hover:text-foreground";

const STEPS = [
  ["Pick your dates", "Choose breaks, finals, and class start and end dates for the terms you care about, plus when to be reminded."],
  ["Subscribe once", "Your calendar app adds the feed as a subscription, not a one-time import, so there is nothing to re-download."],
  ["Stay up to date", "The feed is rebuilt from the UMD Academic Catalog every day, and your calendar app checks it for changes on its own."],
];

const FAQ = [
  [
    "Does it update automatically?",
    "Yes. The feed is rebuilt from the UMD Academic Catalog daily, and your calendar app re-checks it periodically. Google Calendar can take a day or more to show a change.",
  ],
  [
    "Can I change my reminders later?",
    "Your choices are saved in your feed link. To change them, remove the calendar, pick new options here, and subscribe again.",
  ],
  [
    "How do I remove it?",
    "Remove it like any other subscribed calendar. In Google Calendar, find it under Other calendars, open its options, and unsubscribe. In Apple Calendar, right-click it in the sidebar and unsubscribe.",
  ],
  [
    "Does it work with Outlook?",
    "Yes. Copy the link, then in Outlook choose Add calendar, then Subscribe from web, and paste it.",
  ],
  [
    "Is this official?",
    "No. It's an independent student project, not affiliated with or endorsed by the University of Maryland. Dates come from the public UMD Academic Catalog, so confirm anything important there.",
  ],
  [
    "What do you collect?",
    "No accounts, names, or emails. Your feed link includes a random ID so the site can count how many calendars are subscribed. That's all it's used for.",
  ],
];

function Logo() {
  return (
    <span className="flex size-7 items-center justify-center bg-brand text-white">
      <CalendarIcon className="size-4" strokeWidth={2.5} aria-hidden />
    </span>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2.5 font-semibold">
        <span className="flex size-6 items-center justify-center bg-foreground text-xs text-background tabular-nums">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function NextUp({ next, now }: { next: CalEvent; now: Date }) {
  const days = daysUntil(next, now);
  const when = days > 1 ? `in ${days} days` : days === 1 ? "tomorrow" : days === 0 ? "starts today" : "happening now";
  const range = next.s.getTime() === next.e.getTime() ? fmtDay(next.s) : `${fmtDay(next.s)} – ${fmtDay(next.e)}`;
  return (
    <p className="flex flex-wrap items-center gap-x-2 border-l-4 border-brand py-1 pl-3 text-sm">
      <span className="font-semibold text-brand">Next</span>
      <span className="font-medium">{next.title}</span>
      <span className="text-muted-foreground">
        {range} · {when}
      </span>
    </p>
  );
}

export default function Home() {
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [edited, setEdited] = useState<Settings | null>(null);
  const [events, setEvents] = useState<CalEvent[] | null>(null);
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
  const rows = useMemo(() => (now && events ? upcoming(events, settings, now) : []), [events, settings, now]);
  const next = rows.find((e) => e.category === "break" || e.category === "finals") ?? rows[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b-2 border-foreground bg-background">
        <div className={cn(WIDTH, "flex h-16 items-center justify-between")}>
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <Logo />
            UMD Calendar Feed
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how" className={cn(NAV_LINK, "hidden sm:inline")}>
              How it works
            </a>
            <a href="#faq" className={cn(NAV_LINK, "hidden sm:inline")}>
              FAQ
            </a>
            <a href={GITHUB} className={NAV_LINK}>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b">
          <div className={cn(WIDTH, "grid items-start gap-10 py-12 md:grid-cols-[1fr_420px] md:gap-12 md:py-20")}>
            <div className="space-y-6 md:pt-8">
              <p className="text-sm font-semibold text-brand">For University of Maryland students</p>
              <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-pretty md:text-5xl lg:text-[3.5rem]">
                Every UMD break, finals week, and holiday, in your calendar.
              </h1>
              <p className="max-w-[46ch] text-lg text-pretty text-muted-foreground">
                Subscribe once and the dates stay current on their own. Choose what to include and when you want
                reminders. Free, with no account.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <RefreshCwIcon className="size-4 text-foreground" strokeWidth={1.5} aria-hidden />
                  Synced daily from the UMD Academic Catalog
                </li>
                <li className="flex items-center gap-2">
                  <BellIcon className="size-4 text-foreground" strokeWidth={1.5} aria-hidden />
                  Reminders on the days you pick
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-foreground" strokeWidth={1.5} aria-hidden />
                  No account, name, or email
                </li>
              </ul>
              {next && now && <NextUp next={next} now={now} />}
            </div>

            <div className="space-y-6 border border-foreground bg-card p-6">
              <Step n={1} title="Choose what to include">
                <Customize settings={settings} onChange={setEdited} />
              </Step>
              <div className="border-t" />
              <Step n={2} title="Add to your calendar">
                <Subscribe links={links} />
              </Step>
            </div>
          </div>
        </section>

        <section className={cn(WIDTH, "grid gap-8 py-16 md:grid-cols-[1fr_2fr] md:gap-16")}>
          <div className="space-y-4 md:sticky md:top-8 md:self-start">
            <h2 className="text-2xl font-bold tracking-tight">Upcoming dates</h2>
            <p className="text-muted-foreground">
              A preview of what your feed will include with the options above.
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {CATS.map(([c, label]) => (
                <li key={c} className="flex items-center gap-2">
                  <span className={cn("size-2.5", DOT[c])} aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            {failed ? (
              <p className="text-muted-foreground">Couldn&apos;t load the calendar. Try again in a moment.</p>
            ) : now && events ? (
              <Timeline events={rows} settings={settings} now={now} />
            ) : (
              <TimelineSkeleton />
            )}
          </div>
        </section>

        <section id="how" className="scroll-mt-8 border-t">
          <div className={cn(WIDTH, "py-16")}>
            <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map(([title, body], i) => (
                <li key={title} className="border-t-2 border-foreground pt-4">
                  <span className="text-sm font-semibold text-brand tabular-nums">0{i + 1}</span>
                  <h3 className="mt-2 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className={cn(WIDTH, "scroll-mt-8 grid gap-8 py-16 md:grid-cols-[1fr_2fr] md:gap-16")}>
          <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
          <div className="divide-y border-y">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [-webkit-tap-highlight-color:transparent] [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDownIcon
                    className="size-4 shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-[rotate] motion-safe:duration-150 motion-safe:ease-out"
                    aria-hidden
                  />
                </summary>
                <p className="pb-4 text-pretty text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-foreground">
        <div className={cn(WIDTH, "flex flex-col gap-3 py-8 text-sm text-muted-foreground md:flex-row md:justify-between")}>
          <p className="max-w-[60ch] text-pretty">
            An independent student project, not affiliated with or endorsed by the University of Maryland. Dates
            come from the{" "}
            <a className={cn(NAV_LINK, "underline underline-offset-2")} href={CATALOG}>
              UMD Academic Catalog
            </a>{" "}
            and are subject to change.
          </p>
          <a className={cn(NAV_LINK, "shrink-0 underline underline-offset-2")} href={GITHUB}>
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
