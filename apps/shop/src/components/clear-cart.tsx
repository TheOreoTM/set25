"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CHECKOUT_KEY_STORAGE } from "@/lib/cart";
import { useCart } from "./cart-provider";

/** Runs once after a successful checkout redirect, then drops ?placed=1. */
export function ClearCartAfterOrder({ path }: { path: string }) {
  const { clear } = useCart();
  const router = useRouter();
  useEffect(() => {
    clear();
    try {
      window.sessionStorage.removeItem(CHECKOUT_KEY_STORAGE);
    } catch {
      // Storage unavailable: nothing to clear.
    }
    router.replace(path, { scroll: false });
  }, [clear, router, path]);
  return null;
}
