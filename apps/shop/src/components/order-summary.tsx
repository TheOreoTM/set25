import { formatMVR } from "@set25/shared";

export function OrderSummaryRows({
  subtotal,
  delivery,
  discount,
  total,
  totalLabel = "Total",
}: {
  subtotal: string;
  delivery: string | null;
  discount?: { label: string; amount: string } | null;
  total: string;
  totalLabel?: string;
}) {
  return (
    <dl className="summary">
      <div>
        <dt>Subtotal</dt>
        <dd>{formatMVR(subtotal)}</dd>
      </div>
      <div>
        <dt>Delivery</dt>
        <dd>{delivery === null ? "Chosen at checkout" : formatMVR(delivery)}</dd>
      </div>
      {discount ? (
        <div className="summary__discount">
          <dt>{discount.label}</dt>
          <dd>− {formatMVR(discount.amount)}</dd>
        </div>
      ) : null}
      <div className="summary__total">
        <dt>{totalLabel}</dt>
        <dd>{formatMVR(total)}</dd>
      </div>
    </dl>
  );
}
