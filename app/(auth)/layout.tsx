export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_30%)]" />
      <div className="relative z-10 w-full max-w-[1100px] rounded-[40px] border border-[var(--border)] bg-[color-mix(in_oklab,var(--card)_92%,transparent)] p-4 shadow-2xl backdrop-blur md:grid md:grid-cols-[1.1fr_0.9fr] md:p-8">
        <div className="hidden rounded-[30px] bg-[var(--foreground)] p-8 text-[var(--background)] md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[color-mix(in_oklab,var(--background)_70%,transparent)]">
              Private garage
            </p>
            <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight">
              Track fuel, service, costs, and everything your vehicles need.
            </h1>
          </div>
          <div className="grid gap-4 text-sm text-[color-mix(in_oklab,var(--background)_82%,transparent)]">
            <p>Fast phone-first fuel entry.</p>
            <p>Structured maintenance history with measurements.</p>
            <p>Modern self-hosted deployment for your homelab.</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-4">{children}</div>
      </div>
    </main>
  );
}
