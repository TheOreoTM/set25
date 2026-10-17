// Client-safe cart model. The cart is a convenience for the browser only:
// display fields are snapshots for rendering, never trusted by checkout.

export type CartItem = {
  variantId: string;
  quantity: number;
  slug: string;
  name: string;
  variantLabel: string;
  /** Display-only price string; the server re-prices every line. */
  unitPrice: string;
  image: { url: string; alt: string } | null;
};

export const CART_STORAGE_KEY = "set25.cart.v1";
export const CHECKOUT_KEY_STORAGE = "set25.checkout-key";
export const MAX_QUANTITY = 10;
