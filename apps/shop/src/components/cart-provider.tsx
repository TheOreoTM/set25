"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { CART_STORAGE_KEY, MAX_QUANTITY, type CartItem } from "@/lib/cart";

// Browser cart persisted in localStorage. It survives refreshes and syncs
// across tabs. It is display state only: checkout re-prices every line.

const listeners = new Set<() => void>();
let snapshot: CartItem[] | null = null;
const EMPTY: CartItem[] = [];

function read(): CartItem[] {
  if (snapshot) return snapshot;
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]",
    );
    snapshot = Array.isArray(parsed)
      ? parsed.filter(
          (item): item is CartItem =>
            Boolean(item) &&
            typeof item.variantId === "string" &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0,
        )
      : [];
  } catch {
    snapshot = [];
  }
  return snapshot;
}

function write(items: CartItem[]) {
  snapshot = items;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private mode or full storage: the cart still works for this page view.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== CART_STORAGE_KEY) return;
    snapshot = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

type CartContextValue = {
  items: CartItem[];
  /** False during server render and the first client render. */
  ready: boolean;
  count: number;
  add: (item: CartItem) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const add = useCallback((item: CartItem) => {
    const current = read();
    const existing = current.find((entry) => entry.variantId === item.variantId);
    write(
      existing
        ? current.map((entry) =>
            entry.variantId === item.variantId
              ? {
                  ...item,
                  quantity: Math.min(
                    MAX_QUANTITY,
                    entry.quantity + item.quantity,
                  ),
                }
              : entry,
          )
        : [...current, { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity) }],
    );
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    const next = Math.max(1, Math.min(MAX_QUANTITY, quantity));
    write(
      read().map((entry) =>
        entry.variantId === variantId ? { ...entry, quantity: next } : entry,
      ),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    write(read().filter((entry) => entry.variantId !== variantId));
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo(
    () => ({
      items,
      ready,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, ready, add, setQuantity, remove, clear],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
