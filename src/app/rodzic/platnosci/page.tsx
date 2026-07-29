import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge, EmptyState, Field } from "@/components/ui";
import { formatMoney, upsertInvoice } from "@/lib/billing";
import { formatPl, monthLabel } from "@/lib/dates";
import { paymentMethodLabel, remainingDue, sumActivePayments } from "@/lib/payments";

export default async function ParentPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; y?: string; m?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.y) || now.getFullYear();
  const month = Number(params.m) || now.getMonth() + 1;

  const links = await prisma.parentChild.findMany({
    where: { parentId: session!.user.id },
    include: { child: true },
  });

  if (links.length === 0) {
    return (
      <>
        <PageHeader title="Płatności" />
        <EmptyState>Brak dzieci na koncie.</EmptyState>
      </>
    );
  }

  const childId = params.child || links[0]!.childId;
  const child = links.find((l) => l.childId === childId)?.child || links[0]!.child;
  const settings = await prisma.mealSettings.findUnique({ where: { id: "default" } });
  const invoice = await upsertInvoice(child.id, year, month);
  const paidSum = await sumActivePayments(invoice.id);
  const remaining = await remainingDue(invoice.id);

  const payments = await prisma.payment.findMany({
    where: {
      childId: child.id,
      cancelledAt: null,
      invoice: { year, month },
    },
    orderBy: { paidAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Jak zapłacić"
        description="Przelej należność na konto szkoły. W tytule użyj podanego tekstu."
      />

      <div className="flex flex-wrap gap-1.5 mb-3">
        {links.map((l) => (
          <a
            key={l.childId}
            href={`/rodzic/platnosci?child=${l.childId}&y=${year}&m=${month}`}
            className={`btn btn-xs ${l.childId === child.id ? "btn-primary" : "btn-secondary"}`}
          >
            {l.child.firstName} {l.child.lastName}
          </a>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2 max-w-4xl">
        <div className="panel form-stack">
          <p className="text-ink-soft text-xs capitalize">{monthLabel(year, month)}</p>
          <p className="font-display text-3xl text-brand leading-none">
            {formatMoney(remaining)}
          </p>
          <p className="text-xs text-ink-soft">
            Należność {formatMoney(invoice.amount)} · wpłacono {formatMoney(paidSum)}
          </p>
          <StatusBadge status={invoice.status} />

          <Field label="Odbiorca" inline={false}>
            <p className="font-semibold">{settings?.bankRecipient}</p>
          </Field>
          <Field label="Numer rachunku" inline={false}>
            <p className="font-mono text-sm tracking-wide">{settings?.bankAccount}</p>
          </Field>
          <Field label="Tytuł przelewu" inline={false}>
            <p className="font-semibold break-words">{invoice.transferTitle}</p>
          </Field>

          <p className="text-xs text-ink-soft">
            Status aktualizuje szkoła po zaksięgowaniu przelewu.
          </p>
        </div>

        <div className="panel">
          <h2 className="font-display text-lg mb-2">Historia wpłat</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-ink-soft">Brak zarejestrowanych wpłat w tym miesiącu.</p>
          ) : (
            <ul className="compact-list text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-2 items-start">
                  <div>
                    <p className="font-semibold">{formatMoney(p.amount)}</p>
                    <p className="text-xs text-ink-soft">
                      {formatPl(p.paidAt, "d MMM yyyy")} · {paymentMethodLabel(p.method)}
                    </p>
                    <p className="text-[11px] font-mono text-ink-soft">{p.receiptNo}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
