import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/billing";
import { formatPl, monthLabel } from "@/lib/dates";
import { paymentMethodLabel } from "@/lib/payments";
import { PrintButton } from "@/components/PrintButton";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      child: true,
      invoice: true,
      payerUser: true,
    },
  });
  if (!payment) notFound();

  const settings = await prisma.mealSettings.findUnique({
    where: { id: "default" },
  });

  return (
    <>
      <div className="no-print mb-3 flex flex-wrap gap-2 items-center">
        <Link href="/admin/wplaty" className="btn btn-secondary btn-xs">
          ← Lista wpłat
        </Link>
        <Link
          href={`/admin/rozliczenia?y=${payment.invoice.year}&m=${payment.invoice.month}`}
          className="btn btn-secondary btn-xs"
        >
          Rozliczenia
        </Link>
        <PrintButton label="Drukuj pokwitowanie" />
      </div>

      <article className="receipt panel max-w-2xl mx-auto bg-white">
        <header className="border-b border-line pb-3 mb-4 text-center">
          <p className="font-display text-2xl text-brand">Obiady</p>
          <p className="font-semibold mt-1">{settings?.bankRecipient || "Szkoła"}</p>
          <p className="text-sm text-ink-soft mt-2">POKWITOWANIE WPŁATY</p>
          <p className="font-mono text-sm mt-1">{payment.receiptNo}</p>
        </header>

        <dl className="grid gap-2 text-sm">
          <Row label="Data wpłaty" value={formatPl(payment.paidAt, "d MMMM yyyy")} />
          <Row label="Płatnik" value={payment.payerName} />
          <Row
            label="Za dziecko"
            value={`${payment.child.firstName} ${payment.child.lastName} (${payment.child.className})`}
          />
          <Row
            label="Okres"
            value={monthLabel(payment.invoice.year, payment.invoice.month)}
          />
          <Row label="Kwota" value={formatMoney(payment.amount)} emphasize />
          <Row label="Metoda" value={paymentMethodLabel(payment.method)} />
          {payment.reference ? (
            <Row label="Tytuł / referencja" value={payment.reference} />
          ) : null}
          {payment.note ? <Row label="Notatka" value={payment.note} /> : null}
          {payment.cancelledAt ? (
            <Row
              label="Status"
              value={`ANULOWANE ${formatPl(payment.cancelledAt, "d MMMM yyyy")}`}
            />
          ) : null}
        </dl>

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
          <div className="border-t border-line pt-2 text-center text-ink-soft">
            Podpis płatnika
          </div>
          <div className="border-t border-line pt-2 text-center text-ink-soft">
            Pieczątka / podpis szkoły
          </div>
        </div>

        <p className="mt-6 text-[11px] text-ink-soft text-center">
          Dokument wygenerowany w systemie Obiady · {formatPl(new Date(), "d MMMM yyyy HH:mm")}
        </p>
      </article>
    </>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/60 pb-1.5">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={emphasize ? "font-display text-xl text-brand" : "font-semibold text-right"}>
        {value}
      </dd>
    </div>
  );
}
