import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CartView } from "@/components/cart-view";
import { getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <main className="page">
      <header className="page-head page-head--compact">
        <p className="eyebrow eyebrow--slash">Your cart</p>
        <h1 className="page-title">Cart</h1>
      </header>
      <Suspense fallback={<div className="skeleton skeleton--block" aria-hidden="true" />}>
        <CartContent />
      </Suspense>
    </main>
  );
}

async function CartContent() {
  await connection();
  const settings = await getStoreSettings();
  return <CartView storeOpen={settings.storeOpen} />;
}
