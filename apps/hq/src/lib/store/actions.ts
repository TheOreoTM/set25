"use server";

import { db, Prisma } from "@set25/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperationalAccess } from "@/lib/auth/session";
import {
  validateDeliveryOption,
  validateStoreSettings,
  type StoreFormState,
} from "./validation";

// The Store reads these values with a short cache lifetime, so changes reach
// customers within about a minute. Checkout always re-reads them fresh.

function failure(
  message: string,
  errors?: Record<string, string[]>,
): StoreFormState {
  return { status: "error", message, errors };
}

export async function updateStoreSettingsAction(
  _state: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const staff = await requireOperationalAccess();
  const result = validateStoreSettings(formData);
  if (!result.success)
    return failure("Check the highlighted settings.", result.errors);
  try {
    await db.storeSettings.upsert({
      where: { id: "store" },
      create: { id: "store", ...result.data, updatedById: staff.id },
      update: { ...result.data, updatedById: staff.id },
    });
  } catch (error) {
    console.error(error);
    return failure("SET25 HQ could not save the Store settings.");
  }
  revalidatePath("/settings/store");
  redirect("/settings/store?saved=settings");
}

export async function createDeliveryOptionAction(
  _state: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  await requireOperationalAccess();
  const result = validateDeliveryOption(formData);
  if (!result.success)
    return failure("Check the delivery option.", result.errors);
  try {
    await db.deliveryOption.create({
      data: { ...result.data, price: new Prisma.Decimal(result.data.price) },
    });
  } catch (error) {
    console.error(error);
    return failure("SET25 HQ could not add this delivery option.");
  }
  revalidatePath("/settings/store");
  redirect("/settings/store?saved=delivery");
}

export async function updateDeliveryOptionAction(
  id: string,
  _state: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  await requireOperationalAccess();
  const result = validateDeliveryOption(formData);
  if (!result.success)
    return failure("Check the delivery option.", result.errors);
  try {
    // Historical orders keep their own method name and fee snapshot, so
    // editing an option never rewrites past deliveries.
    await db.deliveryOption.update({
      where: { id },
      data: { ...result.data, price: new Prisma.Decimal(result.data.price) },
    });
  } catch (error) {
    console.error(error);
    return failure("SET25 HQ could not save this delivery option.");
  }
  revalidatePath("/settings/store");
  redirect("/settings/store?saved=delivery");
}
