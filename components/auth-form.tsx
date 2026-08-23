"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { ok: false, error: "" };

export function AuthForm({
  action,
  title,
  description,
  fields,
  submitLabel,
}: {
  action: (
    state: { ok: boolean; error: string },
    formData: FormData,
  ) => Promise<{ ok: boolean; error: string }>;
  title: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
  }>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="w-full max-w-[480px]">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {fields.map((field) => (
            <div className="space-y-2" key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
                required
                type={field.type ?? "text"}
              />
            </div>
          ))}
          {state?.error ? (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {state.error}
            </p>
          ) : null}
          <Button className="w-full" disabled={pending} size="lg">
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
