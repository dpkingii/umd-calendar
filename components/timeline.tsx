import { CAT_NAME, fmtDay, fmtRange, hourLabel, reminders, type CalEvent, type Category, type Settings } from "@/lib/calendar";

const DOT: Record<Category, string> = {
  break: "bg-brand",
  finals: "bg-amber-400",
  classes: "bg-blue-600",
  other: "bg-slate-400",
};

const month = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

function Row({ e, settings, now }: { e: CalEvent; settings: Settings; now: Date }) {
  const alerts = reminders(e, settings, now);
  return (
    <article className="grid grid-cols-[3rem_1fr] gap-4 py-3.5">
      <div className="text-center leading-tight">
        <div className="text-xl font-medium">{e.s.getDate()}</div>
        <div className="text-xs text-muted-foreground uppercase">{e.s.toLocaleDateString("en-US", { month: "short" })}</div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${DOT[e.category]}`} />
          <span className="font-medium">{e.title}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {CAT_NAME[e.category]} · {fmtRange(e)}
          {alerts.length > 0 && ` · Alerts ${alerts.map((a) => `${fmtDay(a)}, ${hourLabel(a.getHours())}`).join(" and ")}`}
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
          <h3 className="mb-1 text-sm font-medium text-muted-foreground">{m}</h3>
          <div className="divide-y divide-slate-100">
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
