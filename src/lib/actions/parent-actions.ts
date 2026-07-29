"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isAbsenceEditable,
  parseDateKey,
  startOfDay,
  toDateKey,
} from "@/lib/dates";
import { upsertInvoice } from "@/lib/billing";

export async function toggleAbsenceAction(formData: FormData) {
  const session = await requireParent();
  const childId = String(formData.get("childId"));
  const date = startOfDay(parseDateKey(String(formData.get("date"))));

  const link = await prisma.parentChild.findUnique({
    where: {
      parentId_childId: { parentId: session.user.id, childId },
    },
  });
  if (!link) {
    throw new Error("FORBIDDEN");
  }

  const settings = await prisma.mealSettings.findUnique({
    where: { id: "default" },
  });
  const deadlineHour = settings?.deadlineHour ?? 14;

  if (!isAbsenceEditable(date, deadlineHour)) {
    throw new Error("DEADLINE");
  }

  const existing = await prisma.absence.findUnique({
    where: { childId_date: { childId, date } },
  });

  let message: "added" | "removed";
  if (existing) {
    await prisma.absence.delete({ where: { id: existing.id } });
    message = "removed";
  } else {
    await prisma.absence.create({
      data: {
        childId,
        date,
        reportedById: session.user.id,
        onTime: true,
      },
    });
    message = "added";
  }

  await upsertInvoice(childId, date.getFullYear(), date.getMonth() + 1);
  revalidatePath("/rodzic");

  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  redirect(
    `/rodzic?child=${childId}&y=${y}&m=${m}&ok=${message}&day=${toDateKey(date)}`,
  );
}
