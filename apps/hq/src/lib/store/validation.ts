export type StoreFormState = {
  status: "idle" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialStoreFormState: StoreFormState = {
  status: "idle",
  message: "",
};

type Errors = Record<string, string[]>;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string) {
  return value || null;
}

function limit(errors: Errors, key: string, value: string, max: number) {
  if (value.length > max)
    errors[key] = [`Keep this under ${max.toLocaleString("en")} characters.`];
}

export function validateStoreSettings(formData: FormData) {
  const errors: Errors = {};
  const announcement = text(formData, "announcement");
  const hours = text(formData, "reservationHours");
  const supportPhone = text(formData, "supportPhone");
  const supportWhatsApp = text(formData, "supportWhatsApp").replace(
    /[^\d+]/g,
    "",
  );
  const instagramHandle = text(formData, "instagramHandle").replace(/^@/, "");
  const bankTransferInstructions = text(formData, "bankTransferInstructions");
  const deliveryInstructions = text(formData, "deliveryInstructions");
  limit(errors, "announcement", announcement, 160);
  limit(errors, "supportPhone", supportPhone, 30);
  limit(errors, "supportWhatsApp", supportWhatsApp, 20);
  limit(errors, "bankTransferInstructions", bankTransferInstructions, 1000);
  limit(errors, "deliveryInstructions", deliveryInstructions, 1000);
  if (instagramHandle && !/^[A-Za-z0-9._]{1,30}$/.test(instagramHandle))
    errors.instagramHandle = ["Enter a valid Instagram username."];
  const reservationHours = Number(hours);
  if (
    !/^\d{1,3}$/.test(hours) ||
    reservationHours < 1 ||
    reservationHours > 168
  )
    errors.reservationHours = ["Enter a whole number of hours from 1 to 168."];
  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      storeOpen: formData.get("storeOpen") === "on",
      announcement: optional(announcement),
      reservationHours,
      supportPhone: optional(supportPhone),
      supportWhatsApp: optional(supportWhatsApp),
      instagramHandle: optional(instagramHandle),
      bankTransferInstructions: optional(bankTransferInstructions),
      deliveryInstructions: optional(deliveryInstructions),
    },
  };
}

export function validateDeliveryOption(formData: FormData) {
  const errors: Errors = {};
  const name = text(formData, "name");
  const description = text(formData, "description");
  const price = text(formData, "price");
  const sort = text(formData, "sortOrder") || "0";
  if (name.length < 2 || name.length > 60)
    errors.name = ["Enter a name between 2 and 60 characters."];
  limit(errors, "description", description, 200);
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(price))
    errors.price = ["Enter a delivery price in MVR, such as 50 or 50.00."];
  if (!/^\d{1,3}$/.test(sort))
    errors.sortOrder = ["Enter a position from 0 to 999."];
  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      name,
      description: optional(description),
      price,
      sortOrder: Number(sort),
      active: formData.get("active") === "on",
    },
  };
}
