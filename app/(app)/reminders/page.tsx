import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RemindersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reminders</CardTitle>
        <CardDescription>Time-based and mileage-based schedules are part of the initial schema.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-[var(--muted-foreground)]">
        Reminder CRUD and due-calculation rules will be implemented on the next pass.
      </CardContent>
    </Card>
  );
}
