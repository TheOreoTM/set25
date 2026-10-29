import "server-only";

import { db, Prisma } from "@set25/database";
import {
  OPERATING_EXPENSE_CATEGORIES,
  formatImportNumber,
  formatOrderNumber,
  formatPurchaseOrderNumber,
  moneyCategoryLabels,
} from "@set25/shared";
import { getDateRange } from "@/lib/planning/date-range";

export type MoneyFilters = {
  preset?: string;
  from?: string;
  to?: string;
  direction?: string;
  category?: string;
  search?: string;
};

export async function getProfitSummary(start: Date, end: Date) {
  const orders = await db.order.findMany({
    where: {
      fulfilmentStatus: "COMPLETED",
      completedAt: { gte: start, lt: end },
    },
    select: {
      total: true,
      lines: { select: { quantity: true, unitCost: true } },
    },
  });
  const salesRevenue = orders.reduce(
    (sum, order) => sum.plus(order.total),
    new Prisma.Decimal(0),
  );
  let missingCostLines = 0;
  let missingCostUnits = 0;
  const costOfItemsSold = orders.reduce(
    (sum, order) =>
      order.lines.reduce((lineSum, line) => {
        if (line.unitCost === null) {
          missingCostLines += 1;
          missingCostUnits += line.quantity;
          return lineSum;
        }
        return lineSum.plus(line.unitCost.mul(line.quantity));
      }, sum),
    new Prisma.Decimal(0),
  );
  return {
    salesRevenue,
    costOfItemsSold,
    salesProfit:
      missingCostLines === 0 ? salesRevenue.minus(costOfItemsSold) : null,
    missingCostLines,
    missingCostUnits,
  };
}

export async function getMoneyReport(filters: MoneyFilters = {}) {
  const range = getDateRange(filters);
  const [payments, entries, profit] = await Promise.all([
    db.payment.findMany({
      where: { createdAt: { gte: range.start, lt: range.end } },
      select: {
        id: true,
        type: true,
        amount: true,
        reference: true,
        notes: true,
        createdAt: true,
        recordedBy: { select: { name: true } },
        order: { select: { id: true, orderNumber: true, type: true } },
      },
    }),
    db.moneyEntry.findMany({
      where: { occurredAt: { gte: range.start, lt: range.end } },
      include: {
        createdBy: { select: { name: true } },
        supplier: { select: { id: true, name: true } },
        purchaseOrder: {
          select: { id: true, purchaseOrderNumber: true },
        },
        importShipment: { select: { id: true, importNumber: true } },
        order: { select: { id: true, orderNumber: true, type: true } },
      },
    }),
    getProfitSummary(range.start, range.end),
  ]);

  const paymentNet = payments.reduce(
    (sum, payment) =>
      payment.type === "PAYMENT"
        ? sum.plus(payment.amount)
        : sum.minus(payment.amount),
    new Prisma.Decimal(0),
  );
  const manualIn = entries
    .filter((entry) => entry.direction === "IN")
    .reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0));
  const moneyOut = entries
    .filter((entry) => entry.direction === "OUT")
    .reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0));
  const operatingExpenses = entries
    .filter(
      (entry) =>
        entry.direction === "OUT" &&
        OPERATING_EXPENSE_CATEGORIES.includes(entry.category as never),
    )
    .reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0));
  const moneyIn = paymentNet.plus(manualIn);
  const netCashRecorded = moneyIn.minus(moneyOut);
  const operatingProfit = profit.salesProfit?.minus(operatingExpenses) ?? null;

  const paymentActivity = payments.map((payment) => ({
    id: `payment:${payment.id}`,
    date: payment.createdAt.toISOString(),
    direction: "IN" as const,
    category: "ORDER_PAYMENT",
    type: payment.type === "PAYMENT" ? "Order Payment" : "Order Refund",
    description:
      payment.notes ??
      `${payment.type === "PAYMENT" ? "Payment received" : "Customer refund"} for ${formatOrderNumber(payment.order.orderNumber)}`,
    reference: payment.reference,
    related: formatOrderNumber(payment.order.orderNumber),
    relatedHref: `/${payment.order.type === "PREORDER" ? "preorders" : "orders"}/${payment.order.id}`,
    inAmount:
      payment.type === "PAYMENT"
        ? payment.amount.toString()
        : payment.amount.negated().toString(),
    outAmount: null,
    original: null,
    recordedBy: payment.recordedBy.name,
  }));
  const manualActivity = entries.map((entry) => {
    const related = moneyEntryRelated(entry);
    return {
      id: `entry:${entry.id}`,
      date: entry.occurredAt.toISOString(),
      direction: entry.direction,
      category: entry.category,
      type: moneyCategoryLabels[entry.category],
      description: entry.description,
      reference: entry.reference,
      related: related?.label ?? null,
      relatedHref: related?.href ?? null,
      inAmount: entry.direction === "IN" ? entry.amount.toString() : null,
      outAmount: entry.direction === "OUT" ? entry.amount.toString() : null,
      original:
        entry.originalCurrency &&
        entry.originalAmount &&
        entry.exchangeRateToMvr
          ? {
              currency: entry.originalCurrency,
              amount: entry.originalAmount.toString(),
              rate: entry.exchangeRateToMvr.toString(),
            }
          : null,
      recordedBy: entry.createdBy.name,
    };
  });
  const search = filters.search?.trim().toLowerCase();
  const activity = [...paymentActivity, ...manualActivity]
    .filter(
      (item) => !filters.direction || item.direction === filters.direction,
    )
    .filter(
      (item) =>
        !filters.category ||
        (filters.category === "ORDER_PAYMENT"
          ? item.category === "ORDER_PAYMENT"
          : item.category === filters.category),
    )
    .filter(
      (item) =>
        !search ||
        [item.description, item.reference, item.related, item.type]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search)),
    )
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return {
    range,
    summary: {
      moneyIn,
      moneyOut,
      netCashRecorded,
      operatingExpenses,
      operatingProfit,
      ...profit,
    },
    activity,
  };
}

function moneyEntryRelated(entry: {
  supplier: { id: string; name: string } | null;
  purchaseOrder: { id: string; purchaseOrderNumber: number } | null;
  importShipment: { id: string; importNumber: number } | null;
  order: {
    id: string;
    orderNumber: number;
    type: "STANDARD" | "PREORDER";
  } | null;
}) {
  if (entry.supplier)
    return {
      label: entry.supplier.name,
      href: `/suppliers/${entry.supplier.id}`,
    };
  if (entry.purchaseOrder)
    return {
      label: formatPurchaseOrderNumber(entry.purchaseOrder.purchaseOrderNumber),
      href: `/purchase-orders/${entry.purchaseOrder.id}`,
    };
  if (entry.importShipment)
    return {
      label: formatImportNumber(entry.importShipment.importNumber),
      href: `/imports/${entry.importShipment.id}`,
    };
  if (entry.order)
    return {
      label: formatOrderNumber(entry.order.orderNumber),
      href: `/${entry.order.type === "PREORDER" ? "preorders" : "orders"}/${entry.order.id}`,
    };
  return null;
}

export async function getMoneyFormOptions() {
  const [suppliers, purchaseOrders, imports, orders] = await Promise.all([
    db.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 250,
    }),
    db.purchaseOrder.findMany({
      select: {
        id: true,
        purchaseOrderNumber: true,
        supplier: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    db.importShipment.findMany({
      select: { id: true, importNumber: true, freightForwarder: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    db.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        type: true,
        customer: { select: { name: true } },
        team: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
  ]);
  return [
    ...suppliers.map((supplier) => ({
      value: `SUPPLIER:${supplier.id}`,
      group: "Suppliers",
      label: supplier.name,
    })),
    ...purchaseOrders.map((po) => ({
      value: `PURCHASE_ORDER:${po.id}`,
      group: "Purchase Orders",
      label: `${formatPurchaseOrderNumber(po.purchaseOrderNumber)} · ${po.supplier.name}`,
    })),
    ...imports.map((shipment) => ({
      value: `IMPORT:${shipment.id}`,
      group: "Imports",
      label: `${formatImportNumber(shipment.importNumber)} · ${shipment.freightForwarder}`,
    })),
    ...orders.map((order) => ({
      value: `ORDER:${order.id}`,
      group: "Orders / Preorders",
      label: `${formatOrderNumber(order.orderNumber)} · ${order.customer?.name ?? order.team?.name ?? "Customer not recorded"}`,
    })),
  ];
}

export async function getRecordedMoneyOut(where: {
  purchaseOrderId?: string;
  importShipmentId?: string;
}) {
  const result = await db.moneyEntry.aggregate({
    where: { direction: "OUT", ...where },
    _sum: { amount: true },
  });
  return result._sum.amount ?? new Prisma.Decimal(0);
}

/**
 * Dashboard: recorded Money Out to date. Pre-launch this is effectively the
 * investment so far; refunds to customers are Payments, not spending.
 */
export async function getMoneySpentSummary() {
  const month = getDateRange({ preset: "this-month" });
  const [total, thisMonth, byCategory] = await Promise.all([
    db.moneyEntry.aggregate({
      where: { direction: "OUT" },
      _sum: { amount: true },
    }),
    db.moneyEntry.aggregate({
      where: {
        direction: "OUT",
        occurredAt: { gte: month.start, lt: month.end },
      },
      _sum: { amount: true },
    }),
    db.moneyEntry.groupBy({
      by: ["category"],
      where: { direction: "OUT" },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 4,
    }),
  ]);
  return {
    total: total._sum.amount ?? new Prisma.Decimal(0),
    thisMonth: thisMonth._sum.amount ?? new Prisma.Decimal(0),
    topCategories: byCategory.map((group) => ({
      category: group.category,
      label: moneyCategoryLabels[group.category],
      amount: group._sum.amount ?? new Prisma.Decimal(0),
    })),
  };
}
