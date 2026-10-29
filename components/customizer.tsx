"use client";

import { Fragment, useState } from "react";
import { CheckIcon, ChevronDownIcon, CopyIcon, InfoIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CATS, LEADS, TERMS, summarize, type Settings } from "@/lib/calendar";
import { cn } from "@/lib/utils";

type Links = { url: string; apple: string; google: string };

const ICON_SWAP = "col-start-1 row-start-1 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]";
const ICON_SHOWN = "scale-100 opacity-100 blur-none";
const ICON_HIDDEN = "opacity-0 motion-safe:scale-25 motion-safe:blur-[4px]";
const TEXT_LINK =
  "-my-1 py-1 transition-colors duration-150 hover:text-foreground [-webkit-tap-highlight-color:transparent]";

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
          className="h-8 rounded-full px-3 text-muted-foreground [-webkit-tap-highlight-color:transparent] aria-pressed:border-foreground/15 aria-pressed:bg-foreground/[0.06] aria-pressed:text-foreground aria-pressed:hover:bg-foreground/10"
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

export function Subscribe({ links, apple }: { links: Links | null; apple: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!links) return;
    await navigator.clipboard.writeText(links.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const google = { href: links?.google, target: "_blank", rel: "noopener" };
  const primary = apple ? { label: "Add to Apple Calendar", href: links?.apple } : { label: "Add to Google Calendar", ...google };
  const other = apple ? { label: "Google Calendar", ...google } : { label: "Apple Calendar", href: links?.apple };

  return (
    <div className="space-y-3">
      <a
        {...primary}
        className={cn(buttonVariants({ size: "lg" }), "h-11 w-full rounded-full bg-brand text-base text-white hover:bg-brand/90")}
      >
        {primary.label}
      </a>
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <a {...other} className={TEXT_LINK}>
          {other.label}
        </a>
        <span aria-hidden>·</span>
        <button type="button" onClick={copy} className={cn(TEXT_LINK, "inline-flex items-center gap-1.5")}>
          <span className="grid" aria-hidden>
            <CopyIcon className={cn("size-3.5", ICON_SWAP, copied ? ICON_HIDDEN : ICON_SHOWN)} />
            <CheckIcon className={cn("size-3.5", ICON_SWAP, copied ? ICON_SHOWN : ICON_HIDDEN)} />
          </span>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground">Add it once. New dates show up on their own.</p>
    </div>
  );
}

export function Customize({ settings, onChange }: { settings: Settings; onChange: (next: Settings) => void }) {
  return (
    <details className="group rounded-xl bg-muted/60 px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm [-webkit-tap-highlight-color:transparent] [&::-webkit-details-marker]:hidden">
        <span className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
          {summarize(settings).map((part, i) => (
            <Fragment key={part}>
              {i > 0 && <span aria-hidden>·</span>}
              <span>{part}</span>
            </Fragment>
          ))}
        </span>
        <span className="flex shrink-0 items-center gap-1 font-medium">
          Edit
          <ChevronDownIcon className="size-4 group-open:rotate-180 motion-safe:transition-[rotate] motion-safe:duration-150" />
        </span>
      </summary>
      <div className="space-y-4 pt-4">
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
      </div>
    </details>
  );
}
