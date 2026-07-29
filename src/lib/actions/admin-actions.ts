"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { PaymentStatus, Role } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseDateKey, startOfDay, toDateKey } from "@/lib/dates";
import { regenerateInvoicesForMonth, upsertInvoice } from "@/lib/billing";
import { deleteMenuImage, isRemoteImageUrl, saveMenuImage } from "@/lib/uploads";

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/rodzic");
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const mealPrice = Number(formData.get("mealPrice"));
  const bankAccount = String(formData.get("bankAccount") || "").trim();
  const bankRecipient = String(formData.get("bankRecipient") || "").trim();
  const deadlineHour = Number(formData.get("deadlineHour"));

  await prisma.mealSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      mealPrice,
      bankAccount,
      bankRecipient,
      deadlineHour,
    },
    update: { mealPrice, bankAccount, bankRecipient, deadlineHour },
  });

  revalidateAdmin();
}

export async function createChildAction(formData: FormData) {
  await requireAdmin();
  await prisma.child.create({
    data: {
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      className: String(formData.get("className") || "").trim(),
      active: formData.get("active") === "on",
    },
  });
  revalidateAdmin();
}

export async function updateChildAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.child.update({
    where: { id },
    data: {
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      className: String(formData.get("className") || "").trim(),
      active: formData.get("active") === "on",
    },
  });
  revalidateAdmin();
}

export async function createParentAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "haslo123");
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: Role.PARENT,
    },
  });
  revalidateAdmin();
}

export async function linkParentChildAction(formData: FormData) {
  await requireAdmin();
  const parentId = String(formData.get("parentId"));
  const childId = String(formData.get("childId"));
  await prisma.parentChild.upsert({
    where: { parentId_childId: { parentId, childId } },
    create: { parentId, childId },
    update: {},
  });
  revalidateAdmin();
}

export async function unlinkParentChildAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.parentChild.delete({ where: { id } });
  revalidateAdmin();
}

function isNextRedirect(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createMenuFieldAction(formData: FormData) {
  await requireAdmin();
  const label = String(formData.get("label") || "").trim();
  if (!label) redirect("/admin/jadlospis?tab=pozycje");

  const max = await prisma.menuFieldDef.aggregate({ _max: { sortOrder: true } });
  await prisma.menuFieldDef.create({
    data: {
      label,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
      required: formData.get("required") === "on",
      active: true,
    },
  });
  revalidateAdmin();
  redirect("/admin/jadlospis?tab=pozycje");
}

export async function updateMenuFieldAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.menuFieldDef.update({
    where: { id },
    data: {
      label: String(formData.get("label") || "").trim(),
      required: formData.get("required") === "on",
      active: formData.get("active") === "on",
      sortOrder: Number(formData.get("sortOrder") || 0),
    },
  });
  revalidateAdmin();
  redirect("/admin/jadlospis?tab=pozycje");
}

export async function deleteMenuFieldAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.menuFieldDef.delete({ where: { id } });
  revalidateAdmin();
  redirect("/admin/jadlospis?tab=pozycje");
}

export async function moveMenuFieldAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const direction = String(formData.get("direction"));
  const fields = await prisma.menuFieldDef.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const index = fields.findIndex((f) => f.id === id);
  if (index < 0) redirect("/admin/jadlospis?tab=pozycje");

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= fields.length) {
    redirect("/admin/jadlospis?tab=pozycje");
  }

  const a = fields[index]!;
  const b = fields[swapWith]!;
  await prisma.$transaction([
    prisma.menuFieldDef.update({
      where: { id: a.id },
      data: { sortOrder: b.sortOrder },
    }),
    prisma.menuFieldDef.update({
      where: { id: b.id },
      data: { sortOrder: a.sortOrder },
    }),
  ]);
  revalidateAdmin();
  redirect("/admin/jadlospis?tab=pozycje");
}

export async function createDishAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const image = formData.get("image");

  if (!name) redirect("/admin/jadlospis?tab=potrawy&error=1");

  let imagePath: string | null = null;
  if (isRemoteImageUrl(imageUrl)) {
    imagePath = imageUrl;
  } else if (image instanceof File && image.size > 0) {
    imagePath = await saveMenuImage(image);
  }

  await prisma.dish.create({
    data: { name, imagePath, active: true },
  });
  revalidateAdmin();
  const returnTo = String(formData.get("returnTo") || "").trim();
  redirect(returnTo || "/admin/jadlospis?tab=potrawy&ok=1");
}

export async function updateDishAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const removeImage = formData.get("removeImage") === "on";
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const image = formData.get("image");

  const existing = await prisma.dish.findUnique({ where: { id } });
  if (!existing) redirect("/admin/jadlospis?tab=potrawy&error=1");

  let imagePath = existing.imagePath;
  if (removeImage && imagePath) {
    await deleteMenuImage(imagePath);
    imagePath = null;
  }
  if (isRemoteImageUrl(imageUrl)) {
    if (imagePath && imagePath !== imageUrl) await deleteMenuImage(imagePath);
    imagePath = imageUrl;
  } else if (image instanceof File && image.size > 0) {
    if (imagePath) await deleteMenuImage(imagePath);
    imagePath = await saveMenuImage(image);
  }

  await prisma.dish.update({
    where: { id },
    data: {
      name: name || existing.name,
      imagePath,
      active: formData.get("active") === "on",
    },
  });
  revalidateAdmin();
  redirect("/admin/jadlospis?tab=potrawy&ok=1");
}

export async function deleteDishAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) redirect("/admin/jadlospis?tab=potrawy&error=1");

  const existing = await prisma.dish.findUnique({ where: { id } });
  if (!existing) redirect("/admin/jadlospis?tab=potrawy&error=1");

  const inUse = await prisma.menuEntryValue.count({ where: { dishId: id } });
  if (inUse > 0) {
    redirect("/admin/jadlospis?tab=potrawy&error=in_use");
  }

  await deleteMenuImage(existing.imagePath);
  await prisma.dish.delete({ where: { id } });
  revalidateAdmin();
  redirect("/admin/jadlospis?tab=potrawy&ok=1");
}

export async function saveMenuAction(formData: FormData) {
  const dateRaw = String(formData.get("date") || "");
  const dateKey = dateRaw || toDateKey(new Date());

  try {
    await requireAdmin();
    const date = startOfDay(parseDateKey(dateKey));

    const fields = await prisma.menuFieldDef.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });

    for (const field of fields) {
      if (!field.required) continue;
      const dishId = String(formData.get(`dish_${field.id}`) || "").trim();
      if (!dishId) {
        throw new Error(`REQUIRED_FIELD:${field.label}`);
      }
    }

    const entry = await prisma.menuEntry.upsert({
      where: { date },
      create: { date },
      update: {},
    });

    for (const field of fields) {
      const dishId = String(formData.get(`dish_${field.id}`) || "").trim();

      if (!dishId) {
        await prisma.menuEntryValue.deleteMany({
          where: { menuEntryId: entry.id, fieldDefId: field.id },
        });
        continue;
      }

      await prisma.menuEntryValue.upsert({
        where: {
          menuEntryId_fieldDefId: {
            menuEntryId: entry.id,
            fieldDefId: field.id,
          },
        },
        create: {
          menuEntryId: entry.id,
          fieldDefId: field.id,
          dishId,
        },
        update: { dishId },
      });
    }

    revalidateAdmin();
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirect(
      `/admin/jadlospis?tab=dzien&date=${encodeURIComponent(dateKey)}&error=1`,
    );
  }

  redirect(
    `/admin/jadlospis?tab=dzien&date=${encodeURIComponent(dateKey)}&ok=1`,
  );
}

export async function deleteMenuAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.menuEntry.delete({ where: { id } });
  revalidateAdmin();
  redirect("/admin/jadlospis?tab=dzien");
}

export async function setSchoolDayAction(formData: FormData) {
  await requireAdmin();
  const date = startOfDay(parseDateKey(String(formData.get("date"))));
  const hasMeals = formData.get("hasMeals") === "on";
  const note = String(formData.get("note") || "").trim() || null;

  await prisma.schoolDay.upsert({
    where: { date },
    create: { date, hasMeals, note },
    update: { hasMeals, note },
  });
  revalidateAdmin();
}

export async function adminToggleAbsenceAction(formData: FormData) {
  const session = await requireAdmin();
  const childId = String(formData.get("childId"));
  const date = startOfDay(parseDateKey(String(formData.get("date"))));
  const forceOnTime = formData.get("onTime") === "on";

  const existing = await prisma.absence.findUnique({
    where: { childId_date: { childId, date } },
  });

  if (existing) {
    await prisma.absence.delete({ where: { id: existing.id } });
  } else {
    await prisma.absence.create({
      data: {
        childId,
        date,
        reportedById: session.user.id,
        onTime: forceOnTime,
      },
    });
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  await upsertInvoice(childId, year, month);
  revalidateAdmin();
}

export async function generateInvoicesAction(formData: FormData) {
  await requireAdmin();
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  await regenerateInvoicesForMonth(year, month);
  revalidateAdmin();
}

export async function updatePaymentStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as PaymentStatus;
  await prisma.invoiceMonth.update({
    where: { id },
    data: { status },
  });
  revalidateAdmin();
}
