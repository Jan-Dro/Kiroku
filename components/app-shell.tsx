import Link from "next/link";
import { CarFront, LayoutDashboard, Settings, Siren } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: CarFront },
  { href: "/reminders", label: "Reminders", icon: Siren },
];

export function AppShell({
  children,
  pathname,
  userName,
}: {
  children: React.ReactNode;
  pathname: string;
  userName: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden w-[268px] shrink-0 rounded-[30px] border border-[var(--border)] bg-[var(--card)] p-4 md:flex md:flex-col">
          <AppLogo />
          <nav className="mt-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-[oklch(0.58_0.16_255)] text-white"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-2 border-t border-[var(--border)] pt-4">
            <Link
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                pathname.startsWith("/settings")
                  ? "bg-[oklch(0.58_0.16_255)] text-white"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
              )}
              href="/settings"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <div className="rounded-[20px] bg-[var(--muted)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--foreground)]">{userName}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Private self-hosted workspace</p>
            </div>
            <form action={logoutAction} className="mt-4">
              <Button className="w-full" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 mb-6 rounded-[28px] border border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_88%,transparent)] px-4 py-4 backdrop-blur md:hidden">
            <div className="flex items-center justify-between">
              <AppLogo />
              <form action={logoutAction}>
                <Button size="sm" variant="outline">
                  Sign out
                </Button>
              </form>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {navigation.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    className={cn(
                    "rounded-full px-4 py-2 text-sm whitespace-nowrap",
                    active
                      ? "bg-[oklch(0.58_0.16_255)] text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                className={cn(
                  "rounded-full px-4 py-2 text-sm whitespace-nowrap",
                  pathname.startsWith("/settings")
                    ? "bg-[oklch(0.58_0.16_255)] text-white"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]",
                )}
                href="/settings"
              >
                Settings
              </Link>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
