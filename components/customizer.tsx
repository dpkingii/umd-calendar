"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, InfoIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CATS, LEADS, TERMS, type Settings } from "@/lib/calendar";
import { cn } from "@/lib/utils";

type Links = { url: string; apple: string; google: string };

const ICON_SWAP = "col-start-1 row-start-1 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";
const ICON_SHOWN = "scale-100 opacity-100 blur-none";
const ICON_HIDDEN = "opacity-0 motion-safe:scale-25 motion-safe:blur-[4px]";

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([v, label]) => (
        <Toggle
          key={v}
          variant="outline"
          pressed={value.includes(v)}
          onPressedChange={(on) => onChange(options.map(([o]) => o).filter((o) => (o === v ? on : value.includes(o))))}
          className="h-8 rounded-full px-3 text-muted-foreground [-webkit-tap-highlight-color:transparent] aria-pressed:border-brand/40 aria-pressed:bg-brand/10 aria-pressed:text-brand aria-pressed:hover:bg-brand/15"
        >
          {value.includes(v) && <CheckIcon />}
          {label}
        </Toggle>
      ))}
    </div>
  );
}

function Group({ title, info, children }: { title: string; info?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{title}</h2>
        {info && (
          <Tooltip>
            <TooltipTrigger
              aria-label={`About ${title.toLowerCase()}`}
              delay={100}
              closeDelay={150}
              className="-m-1.5 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <InfoIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="right">{info}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

export function Customizer({
  settings,
  onChange,
  links,
  top,
}: {
  settings: Settings;
  onChange: (next: Settings) => void;
  links: Links | null;
  top?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!links) return;
    await navigator.clipboard.writeText(links.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto md:overscroll-contain md:border-r md:pr-8">
        {top}
        <Group
          title="Remind me"
          info="How far ahead your calendar alerts you before each event. Pick several: 1 week + 1 day gives two reminders per event."
        >
          <Chips options={LEADS} value={settings.alerts} onChange={(alerts) => onChange({ ...settings, alerts })} />
        </Group>
        <Group title="Include">
          <Chips options={CATS} value={settings.cats} onChange={(cats) => onChange({ ...settings, cats })} />
        </Group>
        <Group title="Terms">
          <Chips options={TERMS} value={settings.terms} onChange={(terms) => onChange({ ...settings, terms })} />
        </Group>
        <Group
          title="Subscribe"
          info="Adds this feed to your calendar app once. After that it updates itself, so new dates and your reminders show up without re-importing. Pick Google or Apple, or copy the link for any other app."
        >
          <a
            href={links?.google}
            target="_blank"
            rel="noopener"
            className={cn(buttonVariants({ size: "lg" }), "h-10 w-full rounded-full bg-brand text-white hover:bg-brand/90")}
          >
            Add to Google Calendar
          </a>
          <div className="grid grid-cols-2 gap-2">
            <a href={links?.apple} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 rounded-full")}>
              Apple Calendar
            </a>
            <Button variant="outline" size="lg" className="h-10 rounded-full" onClick={copy}>
              <span className="grid" aria-hidden>
                <CopyIcon className={cn(ICON_SWAP, copied ? ICON_HIDDEN : ICON_SHOWN)} />
                <CheckIcon className={cn(ICON_SWAP, copied ? ICON_SHOWN : ICON_HIDDEN)} />
              </span>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </Group>
    </div>
  );
}
