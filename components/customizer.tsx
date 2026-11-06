"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, InfoIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CATS, LEADS, TERMS, trackClick, type Settings } from "@/lib/calendar";
import { cn } from "@/lib/utils";

type Links = { url: string; apple: string; google: string };

const ICON_SWAP = "col-start-1 row-start-1 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";
const ICON_SHOWN = "scale-100 opacity-100 blur-none";
const ICON_HIDDEN = "opacity-0 motion-safe:scale-25 motion-safe:blur-[4px]";
const SECONDARY = "h-10 border-foreground";

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
          className="h-8 px-3 text-muted-foreground has-[svg]:pl-2.5 hover:border-foreground/40 hover:bg-transparent aria-pressed:border-foreground aria-pressed:bg-transparent aria-pressed:text-foreground aria-pressed:hover:bg-transparent [&_svg]:text-brand"
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
        <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{title}</h3>
        {info && (
          <Tooltip>
            <TooltipTrigger
              aria-label={`About ${title.toLowerCase()}`}
              delay={100}
              closeDelay={150}
              className="-m-1.5 p-1.5 text-muted-foreground transition-[color] duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
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

export function Subscribe({ links }: { links: Links | null }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!links) return;
    trackClick("copy");
    await navigator.clipboard.writeText(links.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      <a
        href={links?.google}
        target="_blank"
        rel="noopener"
        onClick={() => trackClick("google")}
        className={cn(buttonVariants({ size: "lg" }), "h-11 w-full bg-brand text-base text-white hover:bg-brand/90")}
      >
        Add to Google Calendar
      </a>
      <div className="grid grid-cols-2 gap-2">
        <a href={links?.apple} onClick={() => trackClick("apple")} className={cn(buttonVariants({ variant: "outline", size: "lg" }), SECONDARY)}>
          Apple Calendar
        </a>
        <button
          type="button"
          onClick={copy}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), SECONDARY)}
        >
          <span className="grid" aria-hidden>
            <CopyIcon className={cn("size-3.5", ICON_SWAP, copied ? ICON_HIDDEN : ICON_SHOWN)} />
            <CheckIcon className={cn("size-3.5", ICON_SWAP, copied ? ICON_SHOWN : ICON_HIDDEN)} />
          </span>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="text-center text-xs text-pretty text-muted-foreground">
        Using Outlook or another app? Copy the link and add it as a calendar subscription.
      </p>
    </div>
  );
}

export function Customize({ settings, onChange }: { settings: Settings; onChange: (next: Settings) => void }) {
  return (
    <div className="space-y-5">
      <Group title="Events">
        <Chips options={CATS} value={settings.cats} onChange={(cats) => onChange({ ...settings, cats })} />
      </Group>
      <Group title="Terms">
        <Chips options={TERMS} value={settings.terms} onChange={(terms) => onChange({ ...settings, terms })} />
      </Group>
      <Group
        title="Remind me"
        info="How far ahead your calendar alerts you before each event. Pick several: 1 week + 1 day gives two reminders per event."
      >
        <Chips options={LEADS} value={settings.alerts} onChange={(alerts) => onChange({ ...settings, alerts })} />
        {settings.alerts.length === 0 && (
          <p className="text-xs text-muted-foreground">None selected, so events are added without alerts.</p>
        )}
      </Group>
    </div>
  );
}
