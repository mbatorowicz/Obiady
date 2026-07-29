"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseDateKey, startOfDay } from "@/lib/dates";
import { cancelPayment, registerPayment } from "@/lib/payments";

function revalidatePayments() {
  revalidatePath("/admin");
  revalidatePath("/admin/rozliczenia");
  revalidatePath("/admin/wplaty");
  revalidatePath("/rodzic");
  revalidatePath("/rodzic/platnosci");
}

export async function registerPaymentAction(formData: FormData) {
  await requireAdmin();

  const childId = String(formData.get("childId") || "");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const amount = Number(String(formData.get("amount") || "").replace(",", "."));
  const method = String(formData.get("method") || "TRANSFER") as "CASH" | "TRANSFER";
  const payerUserId = String(formData.get("payerUserId") || "") || null;
  let payerName = String(formData.get("payerName") || "").trim();
  const reference = String(formData.get("reference") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;
  const paidAtRaw = String(formData.get("paidAt") || "");
  const paidAt = paidAtRaw ? startOfDay(parseDateKey(paidAtRaw)) : startOfDay(new Date());

  if (!childId || !year || !month || !(amount > 0)) {
    throw new Error("INVALID_PAYMENT");
  }

  if (payerUserId) {
    const user = await prisma.user.findUnique({ where: { id: payerUserId } });
    if (user && !payerName) payerName = user.name;
  }
  if (!payerName) {
    throw new Error("MISSING_PAYER");
  }

  const payment = await registerPayment({
    childId,
    year,
    month,
    amount,
    paidAt,
    method: method === "CASH" ? "CASH" : "TRANSFER",
    payerUserId,
    payerName,
    reference,
    note,
  });

  revalidatePayments();
  redirect(`/admin/wplaty/${payment.id}/pokwitowanie`);
}

export async function cancelPaymentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await cancelPayment(id);
  revalidatePayments();
  redirect("/admin/wplaty");
}
