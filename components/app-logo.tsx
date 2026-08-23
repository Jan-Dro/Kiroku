export function AppLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--foreground)] text-xs font-semibold text-[var(--background)]">
        VM
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">Kiroku</p>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Vehicle journal</p>
      </div>
    </div>
  );
}
