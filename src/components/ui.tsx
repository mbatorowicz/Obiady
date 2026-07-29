import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import { NavLinks } from "@/components/NavLinks";

export function AppShell({
  brandHref,
  title,
  nav,
  userName,
  children,
}: {
  brandHref: string;
  title: string;
  nav: { href: string; label: string }[];
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-line/80 bg-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-2.5 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={brandHref} className="font-display text-xl text-brand tracking-tight">
              Obiady
            </Link>
            <span className="hidden sm:inline text-ink-soft text-xs truncate">{title}</span>
          </div>
          <NavLinks items={nav} />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft hidden md:inline text-xs">{userName}</span>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-secondary btn-xs">
                Wyloguj
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-4 md:py-5">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl md:text-3xl tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-0.5 text-sm text-ink-soft max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: "UNPAID" | "PARTIAL" | "PAID" }) {
  const map = {
    UNPAID: "bg-red-100 text-danger",
    PARTIAL: "bg-amber-100 text-warn",
    PAID: "bg-green-100 text-ok",
  } as const;
  const label = {
    UNPAID: "Niezapłacone",
    PARTIAL: "Częściowo",
    PAID: "Zapłacone",
  } as const;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel text-ink-soft text-center py-6 text-sm">{children}</div>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  inline = true,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={`field ${inline ? "field-inline" : ""}`}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
