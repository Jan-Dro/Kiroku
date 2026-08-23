import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExpensesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
        <CardDescription>Expense tracking is modeled and visible in the unified vehicle timeline.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-[var(--muted-foreground)]">
        A dedicated expense workflow will be added after the maintenance and fuel slices are complete.
      </CardContent>
    </Card>
  );
}
