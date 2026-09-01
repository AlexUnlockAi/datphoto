import { requireAdmin } from "@/lib/admin-dal";
import { Sidebar } from "@/components/app/sidebar";
import { MobileNav } from "@/components/app/mobile-nav";
import { Topbar } from "@/components/app/topbar";
import { ThemeToggle } from "@/components/app/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border bg-card px-6 py-4 lg:hidden">
          <MobileNav />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="DatPhotography" className="h-8 w-auto" />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <Topbar />
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
