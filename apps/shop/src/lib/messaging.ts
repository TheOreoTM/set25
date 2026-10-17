import "server-only";

// Customer confirmation boundary. No email/SMS/WhatsApp provider is approved
// yet, so this is deliberately a no-op: checkout never depends on it. A
// provider can be added here later without touching the checkout transaction.

export type OrderPlacedMessage = {
  orderNumber: string;
  recipientName: string;
  phone: string;
  email: string | null;
  total: string;
  orderUrlPath: string;
};

export async function sendOrderConfirmation(message: OrderPlacedMessage) {
  if (process.env.NODE_ENV !== "production")
    console.info(
      `[store] Order ${message.orderNumber} placed. No confirmation provider configured.`,
    );
}
