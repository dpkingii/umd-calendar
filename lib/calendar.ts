export type Category = "break" | "finals" | "classes" | "other";

export type ApiEvent = {
  title: string;
  term: string;
  start: string;
  end: string;
  category: Category;
};

export type CalEvent = ApiEvent & { s: Date; e: Date; termKey: string };

export type Settings = {
  alerts: number[];
  hour: number;
  cats: Category[];
  terms: string[];
};

export const CATS: [Category, string][] = [
  ["break", "Breaks & holidays"],
  ["finals", "Finals"],
  ["classes", "Class start & end"],
  ["other", "Other"],
];
export const TERMS: [string, string][] = [
  ["fall", "Fall"],
  ["winter", "Winter"],
  ["spring", "Spring"],
  ["summer", "Summer"],
];
export const LEADS: [number, string][] = [
  [14, "2 weeks"],
  [7, "1 week"],
  [3, "3 days"],
  [1, "1 day"],
  [0, "Day of"],
];

export const CAT_NAME = Object.fromEntries(CATS) as Record<Category, string>;

export const DEFAULTS: Settings = {
  alerts: [],
  hour: 9,
  cats: CATS.map(([c]) => c),
  terms: ["fall", "spring"],
};

const DAY_MS = 86400000;

export function parseSettings(search: string): Settings {
  const q = new URLSearchParams(search);
  const list = (key: string) => (q.has(key) ? q.get(key)!.split(",").filter(Boolean) : null);
  const keep = <T extends string | number>(raw: string[] | null, allowed: T[], fallback: T[]) =>
    raw === null ? fallback : allowed.filter((a) => raw.includes(String(a)));
  const hour = Number(q.get("hour") ?? DEFAULTS.hour);
  return {
    alerts: keep(list("alerts"), LEADS.map(([d]) => d), DEFAULTS.alerts),
    hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULTS.hour,
    cats: keep(list("cats"), CATS.map(([c]) => c), DEFAULTS.cats),
    terms: keep(list("terms"), TERMS.map(([t]) => t), DEFAULTS.terms),
  };
}

export function toParams(s: Settings): URLSearchParams {
  return new URLSearchParams({
    alerts: s.alerts.join(","),
    hour: String(s.hour),
    cats: s.cats.join(","),
    terms: s.terms.join(","),
  });
}

// A random ID per browser so the feed can count subscribers. Google Calendar fetches
// each feed URL once for everyone on it, so without this every subscriber looks the same.
function subscriberId(): string {
  try {
    const saved = localStorage.getItem("sub");
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem("sub", id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function feedLinks(origin: string, s: Settings) {
  const url = new URL("/api/feed.ics", origin);
  url.search = toParams(s).toString();
  url.searchParams.set("sub", subscriberId());
  const webcal = url.href.replace(/^https?:/, "webcal:");
  return {
    url: url.href,
    apple: webcal,
    google: "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal),
  };
}

const parseDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function toEvents(data: ApiEvent[]): CalEvent[] {
  return data.map((e) => ({
    ...e,
    s: parseDay(e.start),
    e: parseDay(e.end),
    termKey: e.term.split(" ")[0].toLowerCase(),
  }));
}

export function upcoming(events: CalEvent[], s: Settings, now: Date): CalEvent[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return events
    .filter((e) => s.cats.includes(e.category) && s.terms.includes(e.termKey) && e.e >= today)
    .sort((a, b) => a.s.getTime() - b.s.getTime());
}

export function reminders(e: CalEvent, s: Settings, now: Date): Date[] {
  return s.alerts
    .map((d) => new Date(e.s.getFullYear(), e.s.getMonth(), e.s.getDate() - d, s.hour))
    .filter((r) => r > now)
    .sort((a, b) => a.getTime() - b.getTime());
}

export function daysUntil(e: CalEvent, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((e.s.getTime() - today.getTime()) / DAY_MS);
}

export const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;

export const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const fmtRange = (e: CalEvent) =>
  e.s.getTime() === e.e.getTime()
    ? e.s.toLocaleDateString("en-US", { weekday: "long" })
    : `${fmtDay(e.s)} – ${fmtDay(e.e)}`;
