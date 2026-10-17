"use client";

import { useEffect, useState } from "react";
import { quoteCartAction, type CartQuote } from "@/lib/checkout/actions";
import type { CartItem } from "@/lib/cart";

type QuoteState =
  | { status: "loading"; quote: CartQuote | null }
  | { status: "ready"; quote: CartQuote }
  | { status: "error"; message: string; quote: CartQuote | null };

type Resolved = {
  key: string;
  quote: CartQuote | null;
  error: string | null;
};

/**
 * Fetches authoritative prices and availability for the current cart from the
 * server. Client-side prices are only placeholders until this resolves.
 */
export function useCartQuote(
  items: CartItem[],
  options: { deliveryOptionId?: string; discountCode?: string } = {},
): QuoteState {
  const [resolved, setResolved] = useState<Resolved>({
    key: "",
    quote: null,
    error: null,
  });
  const key = JSON.stringify([
    items.map((item) => [item.variantId, item.quantity]),
    options.deliveryOptionId ?? "",
    options.discountCode ?? "",
  ]);

  useEffect(() => {
    let cancelled = false;
    const [pairs, deliveryOptionId, discountCode] = JSON.parse(key) as [
      Array<[string, number]>,
      string,
      string,
    ];
    if (!pairs.length) return;
    quoteCartAction({
      items: pairs.map(([variantId, quantity]) => ({ variantId, quantity })),
      deliveryOptionId: deliveryOptionId || undefined,
      discountCode: discountCode || undefined,
    })
      .then((result) => {
        if (cancelled) return;
        setResolved((current) =>
          result.ok
            ? { key, quote: result, error: null }
            : { key, quote: current.quote, error: result.message },
        );
      })
      .catch(() => {
        if (cancelled) return;
        setResolved((current) => ({
          key,
          quote: current.quote,
          error: "Prices could not be refreshed. Check your connection.",
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (resolved.key !== key) return { status: "loading", quote: resolved.quote };
  if (resolved.error)
    return { status: "error", message: resolved.error, quote: resolved.quote };
  return resolved.quote
    ? { status: "ready", quote: resolved.quote }
    : { status: "loading", quote: null };
}
