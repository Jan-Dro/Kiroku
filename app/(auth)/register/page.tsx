import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <AuthForm
        action={registerAction}
        description="Create a local account with email, username, and password."
        fields={[
          { name: "displayName", label: "Display name", placeholder: "Demo Driver" },
          { name: "email", label: "Email", type: "email", placeholder: "demo@example.com" },
          { name: "username", label: "Username", placeholder: "demo" },
          { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
          { name: "confirmPassword", label: "Confirm password", type: "password", placeholder: "••••••••" },
        ]}
        submitLabel="Create account"
        title="Create your account"
      />
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link className="text-[var(--foreground)] underline underline-offset-4" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
