"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartLink() {
  const { count, ready } = useCart();
  const label = ready
    ? `Cart, ${count} ${count === 1 ? "item" : "items"}`
    : "Cart";
  return (
    <Link className="cart-link" href="/cart" aria-label={label}>
      <ShoppingBag aria-hidden="true" />
      <span className="cart-link__text">Cart</span>
      {ready && count > 0 ? (
        <span className="cart-link__count" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
