"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import {
  formatMVR,
  publicAvailabilityLabels,
  type PublicAvailability,
} from "@set25/shared";
import type { PublicImage, PublicVariant } from "@/lib/catalog";
import { MAX_QUANTITY } from "@/lib/cart";
import { useCart } from "./cart-provider";

export function ProductPurchase({
  slug,
  name,
  variants,
  availability,
  image,
  storeOpen,
}: {
  slug: string;
  name: string;
  variants: PublicVariant[];
  availability: Record<string, PublicAvailability>;
  image: PublicImage | null;
  storeOpen: boolean;
}) {
  const id = useId();
  const { add } = useCart();
  const status = (variant: PublicVariant) =>
    availability[variant.id] ?? "SOLD_OUT";
  const colors = unique(variants.map((variant) => variant.color));
  const sizes = unique(variants.map((variant) => variant.size));
  const firstAvailable =
    variants.find((variant) => status(variant) !== "SOLD_OUT") ?? variants[0];
  const [color, setColor] = useState(firstAvailable?.color ?? null);
  const [size, setSize] = useState(
    sizes.length > 1 ? null : (firstAvailable?.size ?? null),
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const find = (nextColor: string | null, nextSize: string | null) =>
    variants.find(
      (variant) => variant.color === nextColor && variant.size === nextSize,
    );
  const selected = find(color, size);
  const selectedStatus = selected ? status(selected) : null;
  const canAdd = Boolean(selected) && selectedStatus !== "SOLD_OUT";
  const price = selected?.price ?? firstAvailable?.price ?? "0";

  function chooseColor(next: string | null) {
    setColor(next);
    setAdded(false);
    // Keep the size when that combination exists; otherwise ask again.
    if (size !== null && !find(next, size)) setSize(null);
  }

  function addToCart() {
    if (!selected || !canAdd) return;
    add({
      variantId: selected.id,
      quantity,
      slug,
      name,
      variantLabel:
        [selected.color, selected.size].filter(Boolean).join(" / ") ||
        "Standard",
      unitPrice: selected.price,
      image,
    });
    setAdded(true);
  }

  let buttonLabel = "Add to cart";
  if (!selected) buttonLabel = sizes.length > 1 ? "Select a size" : "Select an option";
  else if (selectedStatus === "SOLD_OUT") buttonLabel = "Sold out";

  return (
    <div className="purchase">
      <p className="purchase__price" aria-live="polite">
        {formatMVR(price)}
      </p>

      {colors.length > 1 || (colors.length === 1 && colors[0]) ? (
        <fieldset className="option-group">
          <legend>
            Colour
            {color ? <span className="option-group__value">{color}</span> : null}
          </legend>
          <div className="option-group__choices">
            {colors.map((value) => {
              const any = variants.filter((variant) => variant.color === value);
              const soldOut = any.every((variant) => status(variant) === "SOLD_OUT");
              return (
                <label className="option" key={value ?? "none"}>
                  <input
                    type="radio"
                    name={`${id}-colour`}
                    checked={color === value}
                    onChange={() => chooseColor(value)}
                  />
                  <span>
                    {value ?? "Standard"}
                    {soldOut ? <span className="sr-only"> (sold out)</span> : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {sizes.length > 1 || (sizes.length === 1 && sizes[0]) ? (
        <fieldset className="option-group">
          <legend>
            Size
            {size ? <span className="option-group__value">{size}</span> : null}
          </legend>
          <div className="option-group__choices">
            {sizes.map((value) => {
              const variant = find(color, value);
              const unavailable = !variant;
              const soldOut = variant ? status(variant) === "SOLD_OUT" : false;
              return (
                <label
                  className={`option${soldOut ? " option--sold-out" : ""}`}
                  key={value ?? "none"}
                >
                  <input
                    type="radio"
                    name={`${id}-size`}
                    checked={size === value}
                    disabled={unavailable || soldOut}
                    onChange={() => {
                      setSize(value);
                      setAdded(false);
                    }}
                  />
                  <span>
                    {value ?? "One size"}
                    {unavailable ? (
                      <span className="sr-only"> (not available in this colour)</span>
                    ) : soldOut ? (
                      <span className="sr-only"> (sold out)</span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {selectedStatus ? (
        <p
          className={`purchase__availability availability availability--${selectedStatus.toLowerCase().replace("_", "-")}`}
        >
          <span className="availability__mark" aria-hidden="true" />
          {publicAvailabilityLabels[selectedStatus]}
        </p>
      ) : null}

      <div className="purchase__row">
        <div className="stepper" role="group" aria-label="Quantity">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            <Minus aria-hidden="true" />
          </button>
          <output aria-live="polite" aria-label="Quantity">
            {quantity}
          </output>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= MAX_QUANTITY}
            onClick={() =>
              setQuantity((value) => Math.min(MAX_QUANTITY, value + 1))
            }
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="purchase__sticky">
        <div className="purchase__sticky-price" aria-hidden="true">
          <span>{name}</span>
          <strong>{formatMVR(price)}</strong>
        </div>
        <button
          type="button"
          className="button button--dark button--block"
          disabled={!canAdd}
          onClick={addToCart}
        >
          {buttonLabel}
        </button>
      </div>

      <div className="purchase__feedback" role="status" aria-live="polite">
        {added ? (
          <p>
            <Check aria-hidden="true" /> Added to your cart.{" "}
            <Link href="/cart">View cart</Link>
          </p>
        ) : null}
      </div>

      {!storeOpen ? (
        <p className="notice">
          Online ordering is temporarily unavailable. You can still add items
          to your cart.
        </p>
      ) : null}
    </div>
  );
}

function unique(values: Array<string | null>) {
  return [...new Set(values)];
}
