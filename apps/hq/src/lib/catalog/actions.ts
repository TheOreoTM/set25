"use server";

import { db, Prisma } from "@set25/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  validateProduct,
  validateStockAdjustment,
  validateVariant,
  type FormState,
} from "./validation";
import { applyInventoryMovement, InventoryRuleError } from "./inventory";
import { requireOperationalAccess } from "@/lib/auth/session";

function databaseError(error: unknown): FormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      status: "error",
      message: "A product, slug, code, or SKU already uses that value.",
    };
  }
  console.error(error);
  return {
    status: "error",
    message: "SET25 HQ could not save this change. Please try again.",
  };
}

export async function createProductAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOperationalAccess();
  const result = validateProduct(formData);
  if (!result.success)
    return {
      status: "error",
      message: "Check the highlighted details.",
      errors: result.errors,
    };

  let productId: string;
  try {
    const product = await db.product.create({
      data: result.data,
      select: { id: true },
    });
    productId = product.id;
  } catch (error) {
    return databaseError(error);
  }
  revalidatePath("/products");
  redirect(`/products/${productId}`);
}

export async function updateProductAction(
  productId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOperationalAccess();
  const result = validateProduct(formData);
  if (!result.success)
    return {
      status: "error",
      message: "Check the highlighted details.",
      errors: result.errors,
    };
  try {
    await db.product.update({ where: { id: productId }, data: result.data });
  } catch (error) {
    return databaseError(error);
  }
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  redirect(`/products/${productId}?saved=product`);
}

export async function createVariantAction(
  productId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOperationalAccess();
  const result = validateVariant(formData);
  if (!result.success)
    return {
      status: "error",
      message: "Check the highlighted details.",
      errors: result.errors,
    };
  try {
    await db.productVariant.create({ data: { ...result.data, productId } });
  } catch (error) {
    return databaseError(error);
  }
  revalidatePath("/products");
  revalidatePath("/stock");
  revalidatePath(`/products/${productId}`);
  redirect(`/products/${productId}?saved=variant`);
}

export async function updateVariantAction(
  productId: string,
  variantId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOperationalAccess();
  const result = validateVariant(formData);
  if (!result.success)
    return {
      status: "error",
      message: "Check the highlighted details.",
      errors: result.errors,
    };
  try {
    const updated = await db.productVariant.updateMany({
      where: { id: variantId, productId },
      data: result.data,
    });
    if (updated.count !== 1)
      return { status: "error", message: "That variant no longer exists." };
  } catch (error) {
    return databaseError(error);
  }
  revalidatePath("/products");
  revalidatePath("/stock");
  revalidatePath(`/products/${productId}`);
  redirect(`/products/${productId}?saved=variant`);
}

export async function adjustStockAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireOperationalAccess();
  const result = validateStockAdjustment(formData);
  if (!result.success)
    return {
      status: "error",
      message: "Check the adjustment details.",
      errors: result.errors,
    };
  const input = result.data;

  try {
    await applyInventoryMovement(input, staff.id);
  } catch (error) {
    if (error instanceof InventoryRuleError)
      return { status: "error", message: error.message };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // A concurrent duplicate rolls back its balance update and is safe to treat as success.
    } else {
      return databaseError(error);
    }
  }

  revalidatePath("/stock");
  revalidatePath("/products");
  revalidatePath(input.returnTo);
  const separator = input.returnTo.includes("?") ? "&" : "?";
  redirect(`${input.returnTo}${separator}adjusted=1`);
}
