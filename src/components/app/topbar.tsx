"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, FileText, Receipt, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/theme-toggle";

const QUICK_ACTIONS = [
  { href: "/shoots/new", label: "New Shoot", icon: Camera },
  { href: "/quotes/new", label: "New Quote", icon: FileText },
  { href: "/invoices/new", label: "New Invoice", icon: Receipt },
  { href: "/clients", label: "New Client", icon: UserPlus },
];

export function Topbar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Client-only clock: initial state must stay null on the server to
    // avoid a hydration mismatch, so the first tick has to happen here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="hidden items-center justify-between gap-4 border-b border-border bg-card/60 px-6 py-3 lg:flex">
      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
        <span className="tracking-wide">
          {now
            ? now.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "—"}
        </span>
        <span className="text-border">/</span>
        <span className="w-[68px] tabular-nums">
          {now ? now.toLocaleTimeString(undefined, { hour12: false }) : "--:--:--"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.href}
            variant="outline"
            size="sm"
            render={<Link href={action.href} />}
          >
            <action.icon className="size-3.5" />
            {action.label}
          </Button>
        ))}
        <ThemeToggle />
      </div>
    </header>
  );
}
