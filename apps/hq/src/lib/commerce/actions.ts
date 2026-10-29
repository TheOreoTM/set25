"use server";

import { db, Prisma } from "@set25/database";
import { holdingReservationWhere } from "@set25/database/inventory";
import { formatOrderNumber } from "@set25/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperationalAccess } from "@/lib/auth/session";
import { netPaid } from "./money";
import {
  validateCustomer,
  validateFulfilmentStatus,
  validateOrder,
  validatePayment,
  validatePreorderStatus,
  validateTeam,
  type CommerceFormState,
} from "./validation";

function failure(
  message: string,
  errors?: Record<string, string[]>,
): CommerceFormState {
  return { status: "error", message, errors };
}

async function keepReservationsUntilClosed(
  transaction: Prisma.TransactionClient,
  orderId: string,
) {
  await transaction.stockReservation.updateMany({
    where: { orderId, ...holdingReservationWhere(new Date()) },
    data: { expiresAt: null },
  });
}

function databaseFailure(
  error: unknown,
  message = "SET25 HQ could not save this change. Please try again.",
) {
  console.error(error);
  return failure(message);
}

export async function createCustomerAction(
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  await requireOperationalAccess();
  const result = validateCustomer(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  let id: string;
  try {
    ({ id } = await db.customer.create({
      data: result.data,
      select: { id: true },
    }));
  } catch (error) {
    return databaseFailure(error);
  }
  revalidatePath("/customers");
  redirect(`/customers/${id}?created=customer`);
}

export async function updateCustomerAction(
  id: string,
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  await requireOperationalAccess();
  const result = validateCustomer(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  try {
    await db.customer.update({ where: { id }, data: result.data });
  } catch (error) {
    return databaseFailure(error);
  }
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}?saved=customer`);
}

export async function createTeamAction(
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  await requireOperationalAccess();
  const result = validateTeam(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  let id: string;
  try {
    ({ id } = await db.team.create({
      data: result.data,
      select: { id: true },
    }));
  } catch (error) {
    return databaseFailure(error);
  }
  revalidatePath("/teams");
  redirect(`/teams/${id}?created=team`);
}

export async function updateTeamAction(
  id: string,
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  await requireOperationalAccess();
  const result = validateTeam(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  try {
    await db.team.update({ where: { id }, data: result.data });
  } catch (error) {
    return databaseFailure(error);
  }
  revalidatePath("/teams");
  revalidatePath(`/teams/${id}`);
  redirect(`/teams/${id}?saved=team`);
}

export async function createOrderAction(
  preorder: boolean,
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  const staff = await requireOperationalAccess();
  const result = validateOrder(formData, preorder);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  const input = result.data;

  const duplicate = await db.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true },
  });
  if (duplicate)
    redirect(`/${preorder ? "preorders" : "orders"}/${duplicate.id}`);

  const variants = await db.productVariant.findMany({
    where: {
      id: { in: input.lines.map((line) => line.variantId) },
      active: true,
    },
    include: { product: true },
  });
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));
  if (variantById.size !== input.lines.length)
    return failure(
      "One or more selected variants are no longer available. Reload and try again.",
    );

  const lines = input.lines.map((line) => {
    const variant = variantById.get(line.variantId)!;
    const unitPrice = new Prisma.Decimal(line.unitPrice);
    return {
      variantId: variant.id,
      productName: variant.product.name,
      productCode: variant.product.code,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: line.quantity,
      unitPrice,
      unitCost: variant.cost,
      lineTotal: unitPrice.mul(line.quantity),
    };
  });
  const subtotal = lines.reduce(
    (sum, line) => sum.plus(line.lineTotal),
    new Prisma.Decimal(0),
  );
  const discount = new Prisma.Decimal(input.discountAmount);
  const delivery = new Prisma.Decimal(input.deliveryFee);
  if (discount.greaterThan(subtotal))
    return failure("Discount cannot be greater than the items subtotal.", {
      discountAmount: ["Enter a discount no greater than the subtotal."],
    });
  const total = subtotal.minus(discount).plus(delivery);
  if (total.isNegative()) return failure("The order total cannot be negative.");

  let orderId: string;
  try {
    const order = await db.order.create({
      data: {
        type: preorder ? "PREORDER" : "STANDARD",
        customerId: input.customerId,
        teamId: input.teamId,
        source: input.source,
        notes: input.notes,
        subtotal,
        discountAmount: discount,
        discountSource: discount.greaterThan(0) ? "MANUAL" : null,
        deliveryFee: delivery,
        total,
        createdById: staff.id,
        idempotencyKey: input.idempotencyKey,
        lines: { create: lines },
        ...(preorder && input.preorder
          ? {
              preorder: {
                create: {
                  depositRequired: input.preorder.depositRequired,
                  estimatedArrival: input.preorder.estimatedArrival,
                  notes: input.preorder.notes,
                },
              },
            }
          : {}),
      },
      select: { id: true },
    });
    orderId = order.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await db.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { id: true },
      });
      if (existing)
        redirect(`/${preorder ? "preorders" : "orders"}/${existing.id}`);
    }
    return databaseFailure(
      error,
      "The order could not be created. Please try again.",
    );
  }
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/preorders");
  redirect(`/${preorder ? "preorders" : "orders"}/${orderId}`);
}

export async function recordPaymentAction(
  orderId: string,
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  const staff = await requireOperationalAccess();
  const result = validatePayment(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  const input = result.data;
  try {
    await db.$transaction(
      async (transaction) => {
        const duplicate = await transaction.payment.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: { id: true },
        });
        if (duplicate) return;
        const order = await transaction.order.findUnique({
          where: { id: orderId },
          include: { payments: true, preorder: true },
        });
        if (!order) throw new Error("ORDER_NOT_FOUND");
        const paid = netPaid(order.payments);
        const amount = new Prisma.Decimal(input.amount);
        if (
          input.type === "PAYMENT" &&
          amount.greaterThan(order.total.minus(paid))
        )
          throw new Error("OVERPAYMENT");
        if (input.type === "REFUND" && amount.greaterThan(paid))
          throw new Error("EXCESS_REFUND");
        await transaction.payment.create({
          data: { orderId, ...input, amount, recordedById: staff.id },
        });
        // A paid Store order keeps its stock hold until completion or
        // cancellation. An already-expired hold is not revived.
        if (input.type === "PAYMENT")
          await keepReservationsUntilClosed(transaction, orderId);
        const afterPayment =
          input.type === "PAYMENT" ? paid.plus(amount) : paid.minus(amount);
        if (
          order.preorder &&
          order.preorder.status === "OPEN" &&
          afterPayment.greaterThanOrEqualTo(order.preorder.depositRequired)
        ) {
          await transaction.preorderDetail.update({
            where: { orderId },
            data: { status: "DEPOSIT_PAID" },
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND")
      return failure("That order no longer exists.");
    if (error instanceof Error && error.message === "OVERPAYMENT")
      return failure("This payment is greater than the balance left.", {
        amount: ["Enter an amount no greater than the balance left."],
      });
    if (error instanceof Error && error.message === "EXCESS_REFUND")
      return failure("This refund is greater than the amount paid.", {
        amount: ["Enter an amount no greater than the refundable amount."],
      });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // The unique submission key makes a repeated payment harmless.
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return failure(
        "Another payment changed this order. Review the balance and try again.",
      );
    } else {
      return databaseFailure(
        error,
        "The payment could not be recorded. Please try again.",
      );
    }
  }
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/preorders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/preorders/${orderId}`);
  redirect(
    `/${formData.get("returnTo") === "preorder" ? "preorders" : "orders"}/${orderId}?saved=payment`,
  );
}

export async function updateFulfilmentAction(
  orderId: string,
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  await requireOperationalAccess();
  const status = validateFulfilmentStatus(formData);
  if (!status || status === "COMPLETED" || status === "CANCELLED")
    return failure("Choose a valid in-progress fulfilment status.");
  const rank = { NEW: 0, PREPARING: 1, READY: 2, OUT_FOR_DELIVERY: 3 } as const;
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { fulfilmentStatus: true },
    });
    if (!order) return failure("That order no longer exists.");
    if (
      order.fulfilmentStatus === "COMPLETED" ||
      order.fulfilmentStatus === "CANCELLED"
    )
      return failure(
        "Completed or cancelled orders cannot move back into fulfilment.",
      );
    if (rank[status] < rank[order.fulfilmentStatus])
      return failure("Fulfilment can only move forward.");
    const updated = await db.$transaction(async (transaction) => {
      const result = await transaction.order.updateMany({
        where: {
          id: orderId,
          fulfilmentStatus: order.fulfilmentStatus,
          inventoryAppliedAt: null,
        },
        data: { fulfilmentStatus: status },
      });
      // Staff are working on this order, so its Store hold no longer expires.
      if (result.count === 1 && status !== "NEW")
        await keepReservationsUntilClosed(transaction, orderId);
      return result;
    });
    if (updated.count !== 1)
      return failure(
        "This order changed while you were updating it. Review its current status and try again.",
      );
  } catch (error) {
    return databaseFailure(error);
  }
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/stock");
  revalidatePath(`/orders/${orderId}`);
  redirect(
    `/${formData.get("returnTo") === "preorder" ? "preorders" : "orders"}/${orderId}?saved=fulfilment`,
  );
}

export async function completeOrderAction(
  orderId: string,
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  const staff = await requireOperationalAccess();
  try {
    await db.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        include: { lines: true },
      });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.fulfilmentStatus === "COMPLETED" && order.inventoryAppliedAt)
        return;
      if (order.fulfilmentStatus === "CANCELLED")
        throw new Error("ORDER_CANCELLED");
      if (!order.lines.length) throw new Error("ORDER_EMPTY");

      const variantIds = order.lines
        .map((line) => line.variantId)
        .filter((id): id is string => Boolean(id));
      if (variantIds.length !== order.lines.length)
        throw new Error("VARIANT_MISSING");
      const variants = await transaction.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, stockOnHand: true, sku: true },
      });
      const byId = new Map(variants.map((variant) => [variant.id, variant]));
      for (const line of order.lines) {
        const variant = line.variantId ? byId.get(line.variantId) : undefined;
        if (!variant) throw new Error(`MISSING:${line.sku}`);
        if (variant.stockOnHand < line.quantity)
          throw new Error(`STOCK:${line.sku}:${variant.stockOnHand}`);
      }

      for (const line of order.lines) {
        const updated = await transaction.productVariant.updateMany({
          where: { id: line.variantId!, stockOnHand: { gte: line.quantity } },
          data: { stockOnHand: { decrement: line.quantity } },
        });
        if (updated.count !== 1) throw new Error(`STOCK_CHANGED:${line.sku}`);
        await transaction.inventoryMovement.create({
          data: {
            variantId: line.variantId!,
            type: "SALE",
            quantityChange: -line.quantity,
            notes: `Completed sale ${formatOrderNumber(order.orderNumber)}`,
            reference: formatOrderNumber(order.orderNumber),
            idempotencyKey: `order:${order.id}:line:${line.id}:completion`,
            createdById: staff.id,
          },
        });
      }
      const completedAt = new Date();
      // The SALE movements above deducted the physical units that any Store
      // reservation was holding, so the hold is now consumed (never released
      // and never deducted twice).
      await transaction.stockReservation.updateMany({
        where: { orderId, status: "ACTIVE" },
        data: { status: "CONSUMED", consumedAt: completedAt },
      });
      const completed = await transaction.order.updateMany({
        where: {
          id: orderId,
          fulfilmentStatus: { notIn: ["COMPLETED", "CANCELLED"] },
          inventoryAppliedAt: null,
        },
        data: {
          fulfilmentStatus: "COMPLETED",
          completedAt,
          inventoryAppliedAt: completedAt,
        },
      });
      if (completed.count !== 1) throw new Error("ORDER_STATE_CHANGED");
      if (order.type === "PREORDER") {
        await transaction.preorderDetail.update({
          where: { orderId },
          data: { status: "COMPLETED" },
        });
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // A concurrent completion collided with an inventory idempotency key and rolled back safely.
    } else if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return failure("That order no longer exists.");
    } else if (error instanceof Error && error.message === "ORDER_CANCELLED") {
      return failure("A cancelled order cannot be completed.");
    } else if (error instanceof Error && error.message === "ORDER_EMPTY") {
      return failure("An order needs at least one item before completion.");
    } else if (
      error instanceof Error &&
      error.message === "ORDER_STATE_CHANGED"
    ) {
      return failure(
        "This order changed during completion. No stock was deducted; review it and try again.",
      );
    } else if (
      error instanceof Error &&
      (error.message.startsWith("MISSING:") ||
        error.message === "VARIANT_MISSING")
    ) {
      return failure(
        "A product variant on this order no longer exists, so stock cannot be deducted safely.",
      );
    } else if (error instanceof Error && error.message.startsWith("STOCK:")) {
      const [, sku, available] = error.message.split(":");
      return failure(
        `${sku} has only ${available} available. No stock was deducted.`,
      );
    } else if (
      error instanceof Error &&
      error.message.startsWith("STOCK_CHANGED:")
    ) {
      return failure(
        `${error.message.slice(14)} stock changed during completion. No stock was deducted; try again.`,
      );
    } else {
      return databaseFailure(
        error,
        "The order could not be completed. No stock was deducted.",
      );
    }
  }
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/preorders");
  revalidatePath("/products");
  revalidatePath("/stock");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/preorders/${orderId}`);
  redirect(
    `/${formData.get("returnTo") === "preorder" ? "preorders" : "orders"}/${orderId}?saved=completed`,
  );
}

export async function cancelOrderAction(
  orderId: string,
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  await requireOperationalAccess();
  try {
    await db.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        select: { fulfilmentStatus: true, type: true },
      });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.fulfilmentStatus === "COMPLETED")
        throw new Error("ORDER_COMPLETED");
      if (order.fulfilmentStatus === "CANCELLED") return;
      const cancelledAt = new Date();
      const cancelled = await transaction.order.updateMany({
        where: {
          id: orderId,
          fulfilmentStatus: { notIn: ["COMPLETED", "CANCELLED"] },
          inventoryAppliedAt: null,
        },
        data: { fulfilmentStatus: "CANCELLED", cancelledAt },
      });
      if (cancelled.count !== 1) throw new Error("ORDER_STATE_CHANGED");
      // Reserved units become available to sell again immediately.
      await transaction.stockReservation.updateMany({
        where: { orderId, status: "ACTIVE" },
        data: { status: "RELEASED", releasedAt: cancelledAt },
      });
      if (order.type === "PREORDER") {
        await transaction.preorderDetail.updateMany({
          where: {
            orderId,
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
          data: { status: "CANCELLED" },
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND")
      return failure("That order no longer exists.");
    if (error instanceof Error && error.message === "ORDER_COMPLETED")
      return failure(
        "Completed orders cannot be cancelled. Returns will be handled separately.",
      );
    if (error instanceof Error && error.message === "ORDER_STATE_CHANGED")
      return failure(
        "This order changed while cancellation was being applied. Review its current status and try again.",
      );
    return databaseFailure(error);
  }
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/preorders");
  revalidatePath("/stock");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/preorders/${orderId}`);
  redirect(
    `/${formData.get("returnTo") === "preorder" ? "preorders" : "orders"}/${orderId}?saved=cancelled`,
  );
}

export async function updatePreorderStatusAction(
  orderId: string,
  _state: CommerceFormState,
  formData: FormData,
): Promise<CommerceFormState> {
  await requireOperationalAccess();
  const status = validatePreorderStatus(formData);
  if (!status || status === "COMPLETED" || status === "CANCELLED")
    return failure("Choose a valid active preorder status.");
  try {
    const updated = await db.preorderDetail.updateMany({
      where: { orderId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      data: {
        status,
        supplierOrdered: ["ORDERED", "IN_TRANSIT", "ARRIVED", "READY"].includes(
          status,
        ),
      },
    });
    if (updated.count !== 1)
      return failure("This preorder can no longer be updated.");
  } catch (error) {
    return databaseFailure(error);
  }
  revalidatePath("/preorders");
  revalidatePath(`/preorders/${orderId}`);
  redirect(`/preorders/${orderId}?saved=status`);
}
