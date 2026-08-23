import Link from "next/link";
import { ArrowRight, CarFront, CalendarClock, Fuel, Gauge, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatCurrencyFromCents, formatDate, formatNumber } from "@/lib/utils";

function averageMpg(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null);

  if (valid.length === 0) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const dueSoon = data.vehicles.flatMap((vehicle) =>
    vehicle.reminders.map((reminder) => ({
      ...reminder,
      vehicleName: vehicle.nickname,
    })),
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const garageCards = data.vehicles.map((vehicle) => {
    const mpg = averageMpg(
      vehicle.fuelEntries.map((entry) =>
        entry.calculatedEconomy ? Number(entry.calculatedEconomy.toString()) : null,
      ),
    );
    const nextMaintenance = vehicle.reminders[0] ?? null;
    const fuelSpendThisMonth = vehicle.fuelEntries.reduce((sum, entry) => {
      if (entry.occurredAt >= monthStart) {
        return sum + entry.totalCostCents;
      }

      return sum;
    }, BigInt(0));

    return {
      ...vehicle,
      averageMpg: mpg,
      nextMaintenance,
      fuelSpendThisMonth,
    };
  });

  const totalGarageSpendThisMonth = garageCards.reduce(
    (sum, vehicle) => sum + vehicle.fuelSpendThisMonth,
    BigInt(0),
  );

  const totalGarageMileage = garageCards.reduce((sum, vehicle) => sum + (vehicle.currentMileage ?? 0), 0);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Garage</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your digital garage</h1>
            <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
              Open a vehicle, add a record, and see what needs attention without digging through generic dashboards.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/vehicles/new">
                Add vehicle
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/fuel">Quick fuel entry</Link>
            </Button>
          </div>
        </div>

        {garageCards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {garageCards.map((vehicle) => (
              <Link href={`/vehicles/${vehicle.id}`} key={vehicle.id}>
                <Card className="group h-full overflow-hidden transition-transform duration-200 hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative h-52 overflow-hidden bg-[linear-gradient(145deg,rgba(37,99,235,0.18),rgba(15,23,42,0.04)),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_28%)]">
                      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.32),transparent_55%)]" />
                      {vehicle.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="h-full w-full object-cover"
                          src={`/api/vehicles/${vehicle.id}/image`}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.56),rgba(15,23,42,0.08)_58%,rgba(15,23,42,0.08))]" />
                      <div className="absolute inset-x-6 top-6 flex items-start justify-between gap-4">
                        <Badge className="bg-[rgba(255,255,255,0.12)] text-white backdrop-blur">
                          {vehicle.fuelType ?? "Vehicle"}
                        </Badge>
                        <span className="rounded-full bg-[rgba(15,23,42,0.45)] px-3 py-1 text-xs font-medium text-white backdrop-blur">
                          Open vehicle
                        </span>
                      </div>
                      <div className="absolute inset-x-6 bottom-6">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-white/72">
                              {vehicle.year} {vehicle.make}
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                              {vehicle.model}
                            </h2>
                            <p className="mt-2 text-sm text-white/80">
                              {vehicle.trim || vehicle.nickname}
                            </p>
                          </div>
                          {!vehicle.imagePath ? (
                            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/15 bg-[rgba(15,23,42,0.35)] text-white backdrop-blur">
                              <CarFront className="h-8 w-8" />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-3xl bg-[var(--muted)] p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                            <Gauge className="h-3.5 w-3.5" />
                            Mileage
                          </p>
                          <p className="mt-3 text-xl font-semibold">
                            {vehicle.currentMileage ? `${formatNumber(vehicle.currentMileage, 0)} mi` : "Not set"}
                          </p>
                        </div>
                        <div className="rounded-3xl bg-[var(--muted)] p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                            <Fuel className="h-3.5 w-3.5" />
                            Avg economy
                          </p>
                          <p className="mt-3 text-xl font-semibold">
                            {vehicle.averageMpg ? `${formatNumber(vehicle.averageMpg)} MPG` : "No MPG yet"}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-3xl border border-[var(--border)] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                          Next maintenance
                        </p>
                        <p className="mt-2 font-medium text-[var(--foreground)]">
                          {vehicle.nextMaintenance ? vehicle.nextMaintenance.title : "No reminder yet"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {vehicle.nextMaintenance
                            ? vehicle.nextMaintenance.intervalDistance
                              ? `${formatNumber(vehicle.nextMaintenance.intervalDistance, 0)} mi interval`
                              : vehicle.nextMaintenance.intervalMonths
                                ? `${vehicle.nextMaintenance.intervalMonths} month interval`
                                : "Schedule attached"
                            : "Create a maintenance reminder from the vehicle page."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between rounded-3xl border border-[var(--border)] p-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                            Fuel this month
                          </p>
                          <p className="mt-2 text-xl font-semibold">
                            {formatCurrencyFromCents(vehicle.fuelSpendThisMonth)}
                          </p>
                        </div>
                        <span className="text-sm text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
                          Open details
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No vehicles yet</CardTitle>
              <CardDescription>Start with your first vehicle and the dashboard will turn into a real garage.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/vehicles/new">Create vehicle</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Due soon</CardTitle>
            <CardDescription>Attention-needed items across the garage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueSoon.length > 0 ? (
              dueSoon.slice(0, 5).map((reminder) => (
                <div className="rounded-3xl border border-[var(--border)] p-4" key={reminder.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{reminder.vehicleName}</p>
                    </div>
                    <Badge>{reminder.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {reminder.intervalDistance ? `${formatNumber(reminder.intervalDistance, 0)} mi` : ""}
                    {reminder.intervalDistance && reminder.intervalMonths ? " or " : ""}
                    {reminder.intervalMonths ? `${reminder.intervalMonths} months` : ""}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
                No reminders yet. Add reminder rules to turn the garage into a true maintenance companion.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest fuel, service, expenses, and notes across the garage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentTimeline.length > 0 ? (
              data.recentTimeline.map((event) => (
                <div className="rounded-3xl border border-[var(--border)] p-4" key={event.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {event.maintenanceRecord?.title ??
                        event.fuelEntry?.station ??
                        event.expense?.merchant ??
                        event.vehicleNote?.title ??
                        event.document?.title ??
                        "Odometer update"}
                    </p>
                    <Badge>{event.type}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {event.vehicle.nickname} • {formatDate(event.occurredAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
                Timeline events will appear here once you add fuel, service, expenses, notes, or documents.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted-foreground)]">Useful analytics</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Garage snapshot</h2>
        </div>
        <div className="grid gap-4 border-y border-[var(--border)] py-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <CarFront className="h-4 w-4" />
              Vehicles tracked
            </p>
            <p className="mt-3 text-3xl font-semibold">{garageCards.length}</p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <CalendarClock className="h-4 w-4" />
              Fuel spend this month
            </p>
            <p className="mt-3 text-3xl font-semibold">{formatCurrencyFromCents(totalGarageSpendThisMonth)}</p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Gauge className="h-4 w-4" />
              Total current mileage
            </p>
            <p className="mt-3 text-3xl font-semibold">{formatNumber(totalGarageMileage, 0)} mi</p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Wrench className="h-4 w-4" />
              Active reminders
            </p>
            <p className="mt-3 text-3xl font-semibold">{dueSoon.length}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
