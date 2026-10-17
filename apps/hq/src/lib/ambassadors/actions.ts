"use server";

import { db, Prisma } from "@set25/database";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireOperationalAccess } from "@/lib/auth/session";
import {
  validateAmbassador,
  validateProductGrant,
  type AmbassadorFormState,
} from "./validation";

class GrantRuleError extends Error {}

function failure(
  message: string,
  errors?: Record<string, string[]>,
): AmbassadorFormState {
  return { status: "error", message, errors };
}

function ambassadorData(
  data: Extract<
    ReturnType<typeof validateAmbassador>,
    { success: true }
  >["data"],
) {
  return {
    ...data,
    discountPercent:
      data.discountPercent === null
        ? null
        : new Prisma.Decimal(data.discountPercent),
    commissionPercent:
      data.commissionPercent === null
        ? null
        : new Prisma.Decimal(data.commissionPercent),
  };
}

async function discountCodeTaken(code: string | null, exceptId?: string) {
  if (!code) return false;
  const existing = await db.ambassador.findUnique({
    where: { discountCode: code },
    select: { id: true },
  });
  return Boolean(existing && existing.id !== exceptId);
}

const duplicateCode = () =>
  failure("Check the highlighted details.", {
    discountCode: ["Another ambassador already uses this discount code."],
  });

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createAmbassadorAction(
  _state: AmbassadorFormState,
  formData: FormData,
): Promise<AmbassadorFormState> {
  const staff = await requireOperationalAccess();
  const result = validateAmbassador(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  if (await discountCodeTaken(result.data.discountCode)) return duplicateCode();
  let id: string;
  try {
    ({ id } = await db.ambassador.create({
      data: { ...ambassadorData(result.data), createdById: staff.id },
      select: { id: true },
    }));
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateCode();
    console.error(error);
    return failure("SET25 HQ could not create this ambassador. Try again.");
  }
  revalidatePath("/ambassadors");
  redirect(`/ambassadors/${id}?created=1`);
}

export async function updateAmbassadorAction(
  id: string,
  _state: AmbassadorFormState,
  formData: FormData,
): Promise<AmbassadorFormState> {
  await requireOperationalAccess();
  const result = validateAmbassador(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  if (await discountCodeTaken(result.data.discountCode, id))
    return duplicateCode();
  try {
    await db.ambassador.update({
      where: { id },
      data: ambassadorData(result.data),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateCode();
    console.error(error);
    return failure("SET25 HQ could not save this ambassador. Try again.");
  }
  revalidatePath("/ambassadors");
  revalidatePath(`/ambassadors/${id}`);
  redirect(`/ambassadors/${id}?saved=1`);
}

/**
 * Gives stock to an ambassador. Stock decrement, the GIVEAWAY inventory
 * movement, and the grant record commit together; the idempotency key makes a
 * double submission a no-op.
 */
export async function giveProductAction(
  ambassadorId: string,
  _state: AmbassadorFormState,
  formData: FormData,
): Promise<AmbassadorFormState> {
  const staff = await requireOperationalAccess();
  const result = validateProductGrant(formData);
  if (!result.success)
    return failure(
      result.errors.form?.[0] ?? "Check the highlighted details.",
      result.errors,
    );
  const input = result.data;
  let productId: string | null = null;

  try {
    productId = await db.$transaction(async (tx) => {
      const duplicate = await tx.ambassadorProductGrant.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { variant: { select: { productId: true } } },
      });
      if (duplicate) return duplicate.variant.productId;

      const ambassador = await tx.ambassador.findUnique({
        where: { id: ambassadorId },
        select: { name: true, status: true },
      });
      if (!ambassador)
        throw new GrantRuleError("This ambassador no longer exists.");
      if (ambassador.status === "ENDED")
        throw new GrantRuleError(
          "This ambassador relationship has ended. Change the status before giving product.",
        );

      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
        select: {
          active: true,
          sku: true,
          size: true,
          color: true,
          productId: true,
          product: { select: { name: true, code: true } },
        },
      });
      if (!variant) throw new GrantRuleError("That variant no longer exists.");
      if (!variant.active)
        throw new GrantRuleError("Archived variants cannot be given out.");

      // Conditional decrement: never lets stock go negative under concurrency.
      const updated = await tx.productVariant.updateMany({
        where: { id: input.variantId, stockOnHand: { gte: input.quantity } },
        data: { stockOnHand: { decrement: input.quantity } },
      });
      if (updated.count !== 1)
        throw new GrantRuleError(
          `Not enough stock of ${variant.sku} to give ${input.quantity}.`,
        );

      const movement = await tx.inventoryMovement.create({
        data: {
          variantId: input.variantId,
          type: "GIVEAWAY",
          quantityChange: -input.quantity,
          notes: `Given to ambassador ${ambassador.name}${input.notes ? ` · ${input.notes}` : ""}`,
          reference: `Ambassador: ${ambassador.name}`,
          idempotencyKey: `ambassador-grant:${input.idempotencyKey}`,
          createdById: staff.id,
        },
        select: { id: true },
      });
      await tx.ambassadorProductGrant.create({
        data: {
          ambassadorId,
          variantId: input.variantId,
          inventoryMovementId: movement.id,
          quantity: input.quantity,
          productName: variant.product.name,
          productCode: variant.product.code,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          notes: input.notes,
          givenAt: input.givenAt,
          createdById: staff.id,
          idempotencyKey: input.idempotencyKey,
        },
      });
      return variant.productId;
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof GrantRuleError) return failure(error.message);
    // A concurrent duplicate submission lost the unique-key race; the first
    // one already applied the grant.
    if (!isUniqueViolation(error)) {
      console.error(error);
      return failure("SET25 HQ could not record this giveaway. Try again.");
    }
  }

  revalidatePath(`/ambassadors/${ambassadorId}`);
  revalidatePath("/stock");
  revalidatePath("/");
  if (productId) revalidatePath(`/products/${productId}`);
  redirect(`/ambassadors/${ambassadorId}?given=1`);
}
