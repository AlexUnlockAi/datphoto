import { requireAdmin } from "@/lib/admin-dal";
import { Sidebar } from "@/components/app/sidebar";
import { MobileNav } from "@/components/app/mobile-nav";
import { Topbar } from "@/components/app/topbar";

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
          <span className="font-heading text-lg tracking-wide">
            Dat<span className="text-primary">Photography</span>
          </span>
        </header>
        <Topbar />
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
