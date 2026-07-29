import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { upsertInvoice } from "@/lib/billing";

export async function nextReceiptNo(year: number): Promise<string> {
  const seq = await prisma.$transaction(async (tx) => {
    const current = await tx.receiptSequence.findUnique({ where: { year } });
    if (!current) {
      await tx.receiptSequence.create({ data: { year, last: 1 } });
      return 1;
    }
    const updated = await tx.receiptSequence.update({
      where: { year },
      data: { last: { increment: 1 } },
    });
    return updated.last;
  });
  return `OBI-${year}-${String(seq).padStart(5, "0")}`;
}

export async function sumActivePayments(invoiceId: string): Promise<number> {
  const agg = await prisma.payment.aggregate({
    where: { invoiceId, cancelledAt: null },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

export function statusFromPaid(invoiceAmount: number, paidSum: number): PaymentStatus {
  if (paidSum <= 0.001) return PaymentStatus.UNPAID;
  if (paidSum + 0.001 < invoiceAmount) return PaymentStatus.PARTIAL;
  return PaymentStatus.PAID;
}

export async function refreshInvoicePaymentStatus(invoiceId: string) {
  const invoice = await prisma.invoiceMonth.findUniqueOrThrow({
    where: { id: invoiceId },
  });
  const paid = await sumActivePayments(invoiceId);
  const status = statusFromPaid(invoice.amount, paid);
  return prisma.invoiceMonth.update({
    where: { id: invoiceId },
    data: { status },
  });
}

export async function remainingDue(invoiceId: string): Promise<number> {
  const invoice = await prisma.invoiceMonth.findUniqueOrThrow({
    where: { id: invoiceId },
  });
  const paid = await sumActivePayments(invoiceId);
  return Math.max(0, Math.round((invoice.amount - paid) * 100) / 100);
}

export type RegisterPaymentInput = {
  childId: string;
  year: number;
  month: number;
  amount: number;
  paidAt: Date;
  method: "CASH" | "TRANSFER";
  payerUserId?: string | null;
  payerName: string;
  reference?: string | null;
  note?: string | null;
};

export async function registerPayment(input: RegisterPaymentInput) {
  if (input.amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const invoice = await upsertInvoice(input.childId, input.year, input.month);
  const receiptNo = await nextReceiptNo(input.paidAt.getFullYear());

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      childId: input.childId,
      amount: input.amount,
      paidAt: input.paidAt,
      method: input.method,
      payerUserId: input.payerUserId || null,
      payerName: input.payerName.trim(),
      reference: input.reference?.trim() || null,
      note: input.note?.trim() || null,
      receiptNo,
    },
  });

  await refreshInvoicePaymentStatus(invoice.id);
  return payment;
}

export async function cancelPayment(paymentId: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { cancelledAt: new Date() },
  });
  await refreshInvoicePaymentStatus(payment.invoiceId);
  return payment;
}

export function paymentMethodLabel(method: string): string {
  return method === "CASH" ? "Gotówka" : "Przelew";
}

export type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    child: true;
    invoice: true;
    payerUser: true;
  };
}>;
