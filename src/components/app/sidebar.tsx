"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Camera, LogOut, Receipt, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/login/actions";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/shoots", label: "Shoots", icon: Camera },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/clients", label: "Clients", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="border-b border-sidebar-border px-6 py-5">
        <span className="font-heading text-xl tracking-wider text-sidebar-foreground">
          Dat<span className="text-sidebar-primary">Photography</span>
        </span>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          <p className="font-mono text-[0.65rem] tracking-[0.2em] text-sidebar-foreground/50 uppercase">
            Command Center — Online
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="hud-label px-3 pb-2">Operations</p>
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-sidebar-primary/30 bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <form action={logout} className="border-t border-sidebar-border p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </form>
    </aside>
  );
}
