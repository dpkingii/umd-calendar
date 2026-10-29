import { BellIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CAT_NAME,
  fmtDay,
  hourLabel,
  plural,
  reminders,
  type CalEvent,
  type Category,
  type Settings,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

const DOT: Record<Category, string> = {
  break: "bg-teal-500",
  finals: "bg-amber-400",
  classes: "bg-sky-500",
  other: "bg-stone-400",
};

const month = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
const weekday = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short" });

function Row({ e, settings, now }: { e: CalEvent; settings: Settings; now: Date }) {
  const alerts = reminders(e, settings, now);
  const multi = e.s.getTime() !== e.e.getTime();
  return (
    <article className="grid grid-cols-[3.5rem_1fr] items-center gap-4 py-3">
      <div className="text-center leading-tight">
        <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{weekday(e.s)}</div>
        <div className={cn("font-medium tabular-nums", multi ? "text-base" : "text-xl")}>
          {multi ? `${e.s.getDate()}–${e.e.getDate()}` : e.s.getDate()}
        </div>
      </div>
      <div className="min-w-0">
        <div className="font-medium">{e.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <span className={cn("size-2 rounded-full", DOT[e.category])} aria-hidden />
          {CAT_NAME[e.category]}
          {multi && (
            <>
              <span aria-hidden>·</span>
              <span>through {`${weekday(e.e)}, ${fmtDay(e.e)}`}</span>
            </>
          )}
          {alerts.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <Tooltip>
                <TooltipTrigger
                  delay={100}
                  closeDelay={150}
                  className="-my-1 inline-flex items-center gap-1 rounded py-1 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <BellIcon className="size-3.5" aria-hidden />
                  {plural(alerts.length, "reminder")}
                </TooltipTrigger>
                <TooltipContent>{alerts.map((a) => `${fmtDay(a)}, ${hourLabel(a.getHours())}`).join(" and ")}</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function Timeline({ events, settings, now }: { events: CalEvent[]; settings: Settings; now: Date }) {
  const groups = new Map<string, CalEvent[]>();
  for (const e of events) {
    const m = month(e.s);
    groups.set(m, [...(groups.get(m) ?? []), e]);
  }
  return (
    <div>
      {events.length === 0 && <p className="text-muted-foreground">Nothing matches these filters.</p>}
      {[...groups].map(([m, rows]) => (
        <section key={m} className="mb-6">
          <h3 className="sticky top-0 z-10 bg-background/90 py-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase backdrop-blur">
            {m}
          </h3>
          <div className="divide-y divide-border">
            {rows.map((e) => (
              <Row key={`${e.term}-${e.title}-${e.start}`} e={e} settings={settings} now={now} />
            ))}
          </div>
        </section>
      ))}
      <footer className="mt-8 border-t pt-6 text-sm text-muted-foreground">
        Source:{" "}
        <a
          className="underline underline-offset-2"
          href="https://academiccatalog.umd.edu/about-university/academic-calendar/semester-calendar/"
        >
          UMD Academic Catalog
        </a>
        . Dates are subject to change.
      </footer>
    </div>
  );
}
