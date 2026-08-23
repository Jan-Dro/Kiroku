import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaintenancePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance</CardTitle>
        <CardDescription>Structured records and measurements are modeled in Prisma and seeded.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-[var(--muted-foreground)]">
        The next implementation slice will add maintenance CRUD and reminder reset flows on top of this data model.
      </CardContent>
    </Card>
  );
}
