import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Current account and preference defaults.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
        <p>{user.displayName}</p>
        <p>{user.email}</p>
        <p>Theme: {user.preferences?.theme ?? "SYSTEM"}</p>
        <p>Currency: {user.preferences?.currencyCode ?? "USD"}</p>
      </CardContent>
    </Card>
  );
}
