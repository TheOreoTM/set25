import { Prisma } from "@set25/database";
import { getPaymentStatus, type PaymentStatus } from "@set25/shared";

export function netPaid(
  payments: Array<{
    type: "PAYMENT" | "REFUND";
    amount: { toString(): string };
  }>,
) {
  return payments.reduce(
    (total, payment) =>
      payment.type === "PAYMENT"
        ? total.plus(payment.amount.toString())
        : total.minus(payment.amount.toString()),
    new Prisma.Decimal(0),
  );
}

export function paymentSummary(
  total: { toString(): string },
  payments: Array<{
    type: "PAYMENT" | "REFUND";
    amount: { toString(): string };
  }>,
): { paid: Prisma.Decimal; balance: Prisma.Decimal; status: PaymentStatus } {
  const paid = netPaid(payments);
  const balance = new Prisma.Decimal(total.toString()).minus(paid);
  const status =
    payments.some((payment) => payment.type === "REFUND") &&
    paid.lessThanOrEqualTo(0)
      ? "REFUNDED"
      : getPaymentStatus(total, paid);
  return { paid, balance, status };
}
