import Link from "next/link";
import { type VehicleWorkspaceSection } from "@/lib/vehicle-workspace";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "", section: "overview" },
  { label: "Fuel", href: "/fuel", section: "fuel" },
  { label: "Service", href: "/service", section: "service" },
  { label: "Expenses", href: "/expenses", section: "expenses" },
  { label: "Upgrades", href: "/upgrades", section: "upgrades" },
  { label: "Notes", href: "/notes", section: "notes" },
  { label: "Documents", href: "/documents", section: "documents" },
];

export function VehicleWorkspaceNav({
  vehicleId,
  section,
}: {
  vehicleId: string;
  section: VehicleWorkspaceSection;
}) {
  return (
    <nav className="overflow-x-auto border-b border-[var(--border)]">
      <div className="flex min-w-max gap-6">
        {navItems.map((item) => {
          const href = `/vehicles/${vehicleId}${item.href}`;
          const active = section === item.section;

          return (
            <Link
              className={cn(
                "border-b-2 px-1 py-4 text-sm transition-colors",
                active
                  ? "border-[oklch(0.58_0.16_255)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
              href={href}
              key={href}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
