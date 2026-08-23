import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <AuthForm
        action={loginAction}
        description="Sign in to your private vehicle workspace."
        fields={[
          { name: "emailOrUsername", label: "Email or username", placeholder: "demo@example.com" },
          { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
        ]}
        submitLabel="Sign in"
        title="Welcome back"
      />
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Need an account?{" "}
        <Link className="text-[var(--foreground)] underline underline-offset-4" href="/register">
          Create one
        </Link>
      </p>
    </div>
  );
}
