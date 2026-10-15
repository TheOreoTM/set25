import { db } from "@set25/database";
import type { StockAdjustmentInput } from "./validation";

export class InventoryRuleError extends Error {}

export async function applyInventoryMovement(
  input: StockAdjustmentInput,
  createdById: string,
) {
  return db.$transaction(async (transaction) => {
    const actor = await transaction.staffUser.findFirst({
      where: {
        id: createdById,
        active: true,
        role: { in: ["OWNER", "MANAGER"] },
      },
      select: { id: true },
    });
    if (!actor)
      throw new InventoryRuleError(
        "Your staff access no longer allows stock adjustments.",
      );

    const duplicate = await transaction.inventoryMovement.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true },
    });
    if (duplicate) return { duplicate: true };

    const variant = await transaction.productVariant.findUnique({
      where: { id: input.variantId },
      select: { active: true },
    });
    if (!variant)
      throw new InventoryRuleError("That variant no longer exists.");
    if (!variant.active)
      throw new InventoryRuleError(
        "Archived variants cannot receive stock adjustments.",
      );

    const updated = await transaction.productVariant.updateMany({
      where: {
        id: input.variantId,
        ...(input.quantityChange < 0
          ? { stockOnHand: { gte: -input.quantityChange } }
          : {}),
      },
      data: { stockOnHand: { increment: input.quantityChange } },
    });
    if (updated.count !== 1) {
      throw new InventoryRuleError(
        "This adjustment would make available stock negative.",
      );
    }

    await transaction.inventoryMovement.create({
      data: {
        variantId: input.variantId,
        type: input.type,
        quantityChange: input.quantityChange,
        notes: input.notes,
        reference: input.reference,
        idempotencyKey: input.idempotencyKey,
        createdById,
      },
    });
    return { duplicate: false };
  });
}
