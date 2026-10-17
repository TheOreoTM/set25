import {
  CHECKOUT_PAYMENT_METHODS,
  normalizePhone,
  type CheckoutPaymentMethodValue,
} from "@set25/shared";

export type CheckoutFormState = {
  status: "idle" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialCheckoutFormState: CheckoutFormState = {
  status: "idle",
  message: "",
};

export type CheckoutDetails = {
  name: string;
  phone: string;
  phoneKey: string;
  email: string | null;
  instagramHandle: string | null;
  address: string;
  area: string;
  notes: string | null;
  deliveryOptionId: string;
  paymentMethod: CheckoutPaymentMethodValue;
  discountCode: string | null;
  checkoutKey: string;
  cart: unknown;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCheckout(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const add = (key: string, message: string) => {
    errors[key] = [...(errors[key] ?? []), message];
  };
  const name = text(formData, "name");
  const phone = text(formData, "phone");
  const phoneKey = normalizePhone(phone);
  const email = text(formData, "email").toLowerCase();
  const instagramHandle = text(formData, "instagramHandle").replace(/^@/, "");
  const address = text(formData, "address");
  const area = text(formData, "area");
  const notes = text(formData, "notes");
  const deliveryOptionId = text(formData, "deliveryOptionId");
  const paymentMethod = text(formData, "paymentMethod");
  const discountCode = text(formData, "discountCode");
  const checkoutKey = text(formData, "checkoutKey");

  if (name.length < 2 || name.length > 100)
    add("name", "Enter your full name.");
  if (phone.length > 30 || phoneKey.length < 7 || phoneKey.length > 15)
    add("phone", "Enter a phone number we can reach you on.");
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    add("email", "Enter a valid email address or leave it blank.");
  if (instagramHandle && !/^[A-Za-z0-9._]{1,30}$/.test(instagramHandle))
    add("instagramHandle", "Enter a valid Instagram username or leave it blank.");
  if (address.length < 5 || address.length > 300)
    add("address", "Enter your delivery address, such as house name and street.");
  if (area.length < 2 || area.length > 100)
    add("area", "Enter your island or area.");
  if (notes.length > 500)
    add("notes", "Keep delivery notes under 500 characters.");
  if (!deliveryOptionId || deliveryOptionId.length > 40)
    add("deliveryOptionId", "Choose a delivery option.");
  if (
    !CHECKOUT_PAYMENT_METHODS.includes(
      paymentMethod as CheckoutPaymentMethodValue,
    )
  )
    add("paymentMethod", "Choose how you would like to pay.");
  if (discountCode.length > 30)
    add("discountCode", "Check the discount code.");

  let cart: unknown = null;
  try {
    cart = JSON.parse(text(formData, "cart") || "null");
  } catch {
    cart = null;
  }

  if (Object.keys(errors).length) return { success: false as const, errors };
  if (!UUID.test(checkoutKey)) return { success: false as const, errors: {} };
  return {
    success: true as const,
    data: {
      name,
      phone,
      phoneKey,
      email: email || null,
      instagramHandle: instagramHandle || null,
      address,
      area,
      notes: notes || null,
      deliveryOptionId,
      paymentMethod: paymentMethod as CheckoutPaymentMethodValue,
      discountCode: discountCode || null,
      checkoutKey: checkoutKey.toLowerCase(),
      cart,
    } satisfies CheckoutDetails,
  };
}
