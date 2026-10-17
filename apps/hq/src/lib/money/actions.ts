"use server";

import { db, Prisma } from "@set25/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperationalAccess } from "@/lib/auth/session";
import { validateMoneyEntry, type MoneyFormState } from "./validation";

function failure(
  message: string,
  errors?: Record<string, string[]>,
): MoneyFormState {
  return { status: "error", message, errors };
}

export async function createMoneyEntryAction(
  _state: MoneyFormState,
  formData: FormData,
): Promise<MoneyFormState> {
  const staff = await requireOperationalAccess();
  const result = validateMoneyEntry(formData);
  if (!result.success)
    return failure("Check the highlighted fields.", result.errors);
  const input = result.data;

  const duplicate = await db.moneyEntry.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true },
  });
  if (duplicate) redirect("/money?recorded=1");

  const relation = await validatedRelation(input.relatedType, input.relatedId);
  if (!relation.valid)
    return failure("The related record no longer exists. Choose it again.", {
      related: ["Choose an available related record."],
    });

  try {
    await db.moneyEntry.create({
      data: {
        direction: input.direction,
        category: input.category,
        amount: new Prisma.Decimal(input.amount),
        currency: "MVR",
        occurredAt: input.occurredAt,
        description: input.description,
        reference: input.reference,
        notes: input.notes,
        createdById: staff.id,
        idempotencyKey: input.idempotencyKey,
        ...relation.data,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await db.moneyEntry.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { id: true },
      });
      if (existing) redirect("/money?recorded=1");
    }
    console.error(error);
    return failure("SET25 HQ could not record this money entry. Try again.");
  }

  revalidatePath("/");
  revalidatePath("/money");
  if (input.relatedType === "PURCHASE_ORDER" && input.relatedId)
    revalidatePath(`/purchase-orders/${input.relatedId}`);
  if (input.relatedType === "IMPORT" && input.relatedId)
    revalidatePath(`/imports/${input.relatedId}`);
  redirect("/money?recorded=1");
}

async function validatedRelation(
  type: "SUPPLIER" | "PURCHASE_ORDER" | "IMPORT" | "ORDER" | null,
  id: string | null,
) {
  if (!type || !id) return { valid: true as const, data: {} };
  if (type === "SUPPLIER") {
    const record = await db.supplier.findUnique({
      where: { id },
      select: { id: true },
    });
    return record
      ? { valid: true as const, data: { supplierId: id } }
      : { valid: false as const, data: {} };
  }
  if (type === "PURCHASE_ORDER") {
    const record = await db.purchaseOrder.findUnique({
      where: { id },
      select: { id: true },
    });
    return record
      ? { valid: true as const, data: { purchaseOrderId: id } }
      : { valid: false as const, data: {} };
  }
  if (type === "IMPORT") {
    const record = await db.importShipment.findUnique({
      where: { id },
      select: { id: true },
    });
    return record
      ? { valid: true as const, data: { importShipmentId: id } }
      : { valid: false as const, data: {} };
  }
  const record = await db.order.findUnique({
    where: { id },
    select: { id: true },
  });
  return record
    ? { valid: true as const, data: { orderId: id } }
    : { valid: false as const, data: {} };
}
