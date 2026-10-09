"use client";

import { useState } from "react";
import { CheckIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { CATS, LEADS, TERMS, hourLabel, type Settings } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: hourLabel(h) }));

type Links = { url: string; apple: string; google: string };

function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, label]) => (
        <Toggle
          key={v}
          variant="outline"
          pressed={value.includes(v)}
          onPressedChange={(on) => onChange(options.map(([o]) => o).filter((o) => (o === v ? on : value.includes(o))))}
          className="h-8 rounded-full px-3 text-muted-foreground aria-pressed:border-brand/40 aria-pressed:bg-brand/10 aria-pressed:text-brand aria-pressed:hover:bg-brand/15"
        >
          {value.includes(v) && <CheckIcon />}
          {label}
        </Toggle>
      ))}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{title}</h2>
      {children}
    </div>
  );
}

export function Customizer({
  settings,
  onChange,
  links,
}: {
  settings: Settings;
  onChange: (next: Settings) => void;
  links: Links | null;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!links) return;
    await navigator.clipboard.writeText(links.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="md:sticky md:top-4 md:self-start">
      <CardContent className="space-y-6">
        <Group title="Remind me">
          <Chips options={LEADS} value={settings.alerts} onChange={(alerts) => onChange({ ...settings, alerts })} />
        </Group>
        <Group title="Reminder time">
          <Select
            items={HOURS}
            value={String(settings.hour)}
            onValueChange={(v) => v !== null && onChange({ ...settings, hour: Number(v) })}
          >
            <SelectTrigger className="h-9 w-full" aria-label="Reminder time">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h.value} value={h.value}>
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Group>
        <Group title="Include">
          <Chips options={CATS} value={settings.cats} onChange={(cats) => onChange({ ...settings, cats })} />
        </Group>
        <Group title="Terms">
          <Chips options={TERMS} value={settings.terms} onChange={(terms) => onChange({ ...settings, terms })} />
        </Group>
        <div className="space-y-2">
          <a
            href={links?.google}
            target="_blank"
            rel="noopener"
            className={cn(buttonVariants({ size: "lg" }), "h-10 w-full bg-brand text-white hover:bg-brand/90")}
          >
            Add to Google Calendar
          </a>
          <a href={links?.apple} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 w-full")}>
            Add to Apple Calendar
          </a>
          <Button variant="outline" size="lg" className="h-10 w-full" onClick={copy}>
            {copied ? "Copied" : "Copy feed URL"}
          </Button>
          <p className="rounded-lg bg-muted px-2.5 py-2 font-mono text-xs break-all text-muted-foreground">
            {links?.url ?? " "}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
