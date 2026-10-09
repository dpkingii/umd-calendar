import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CAT_NAME,
  fmtDay,
  fmtRange,
  hourLabel,
  reminders,
  type CalEvent,
  type Category,
  type Settings,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

const TAG: Record<Category, string> = {
  break: "bg-brand text-white",
  finals: "bg-gold text-black",
  classes: "bg-blue-600 text-white",
  other: "bg-muted-foreground text-background",
};

const month = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

function Row({ e, settings, now }: { e: CalEvent; settings: Settings; now: Date }) {
  const alerts = reminders(e, settings, now);
  return (
    <article className="grid grid-cols-[3.5rem_1fr] gap-3.5 border-t py-3">
      <div className="text-center leading-tight">
        <div className="text-2xl font-bold">{e.s.getDate()}</div>
        <div className="text-[0.7rem] tracking-widest text-muted-foreground uppercase">
          {e.s.toLocaleDateString("en-US", { month: "short" })}
        </div>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{e.title}</span>
          <Badge className={cn("font-bold", TAG[e.category])}>{CAT_NAME[e.category]}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">{fmtRange(e)}</div>
        {alerts.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {alerts.map((a) => (
              <span key={a.getTime()} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Alert {fmtDay(a)}, {hourLabel(a.getHours())}
              </span>
            ))}
          </div>
        )}
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
    <Card>
      <CardContent>
        {events.length === 0 && <p className="text-muted-foreground">Nothing matches these filters.</p>}
        {[...groups].map(([m, rows]) => (
          <section key={m}>
            <h3 className="mt-6 mb-2 text-base font-semibold first:mt-0">{m}</h3>
            {rows.map((e) => (
              <Row key={`${e.term}-${e.title}-${e.start}`} e={e} settings={settings} now={now} />
            ))}
          </section>
        ))}
        <footer className="mt-7 text-sm text-muted-foreground">
          Source:{" "}
          <a
            className="underline underline-offset-2"
            href="https://academiccatalog.umd.edu/about-university/academic-calendar/semester-calendar/"
          >
            UMD Academic Catalog
          </a>
          . Dates are subject to change.
        </footer>
      </CardContent>
    </Card>
  );
}
