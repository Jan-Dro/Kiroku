import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FuelPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel tracking</CardTitle>
        <CardDescription>The schema and calculation modules are ready for the next vertical slice.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-[var(--muted-foreground)]">
        This foundation phase establishes protected routes, persistence, auth, dashboard framing, and vehicle detail pages.
      </CardContent>
    </Card>
  );
}
