import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CheckoutForm } from "@/components/checkout-form";
import { readDeliveryOptions, readStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main className="page">
      <header className="page-head page-head--compact">
        <p className="eyebrow eyebrow--slash">Guest checkout</p>
        <h1 className="page-title">Checkout</h1>
      </header>
      <Suspense fallback={<div className="skeleton skeleton--block" aria-hidden="true" />}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}

async function CheckoutContent() {
  // Fresh, uncached: ordering status and delivery prices must be current.
  await connection();
  const [settings, deliveryOptions] = await Promise.all([
    readStoreSettings(),
    readDeliveryOptions(),
  ]);
  if (!settings.storeOpen || !deliveryOptions.length)
    return (
      <section className="empty-cart">
        <h2>Online ordering is temporarily unavailable.</h2>
        <p>Your cart is saved. Please check back soon.</p>
        <Link className="button button--outline" href="/cart">
          Back to cart
        </Link>
      </section>
    );
  return (
    <CheckoutForm
      deliveryOptions={deliveryOptions}
      deliveryInstructions={settings.deliveryInstructions}
    />
  );
}
