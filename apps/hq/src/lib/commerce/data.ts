import "server-only";

import { db, Prisma } from "@set25/database";
import {
  FULFILMENT_STATUSES,
  ORDER_SOURCES,
  type FulfilmentStatusValue,
  type OrderSourceValue,
  type PaymentStatus,
} from "@set25/shared";
import { paymentSummary } from "./money";

export async function getCustomers(search = "") {
  const query = search.trim();
  return db.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { _count: { select: { orders: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(id: string) {
  return db.customer.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          payments: true,
          preorder: true,
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getTeams(search = "") {
  const query = search.trim();
  return db.team.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { contactName: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { _count: { select: { orders: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getTeam(id: string) {
  return db.team.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          customer: true,
          payments: true,
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getOrderFormOptions() {
  const [customers, teams, variants] = await Promise.all([
    db.customer.findMany({ orderBy: { name: "asc" } }),
    db.team.findMany({ orderBy: { name: "asc" } }),
    db.productVariant.findMany({
      where: { active: true, product: { status: "ACTIVE" } },
      include: { product: true },
      orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
    }),
  ]);
  return { customers, teams, variants };
}

export type OrderFilters = {
  search?: string;
  fulfilment?: string;
  payment?: string;
  source?: string;
  type?: "STANDARD" | "PREORDER";
};

export async function getOrders(filters: OrderFilters = {}) {
  const search = filters.search?.trim();
  const fulfilment = FULFILMENT_STATUSES.includes(
    filters.fulfilment as FulfilmentStatusValue,
  )
    ? (filters.fulfilment as FulfilmentStatusValue)
    : undefined;
  const source = ORDER_SOURCES.includes(filters.source as OrderSourceValue)
    ? (filters.source as OrderSourceValue)
    : undefined;
  const numericSearch = search?.match(/^S25-(\d+)$/i)?.[1];
  const orders = await db.order.findMany({
    where: {
      type: filters.type,
      fulfilmentStatus: fulfilment,
      source,
      ...(search
        ? {
            OR: [
              ...(numericSearch
                ? [{ orderNumber: Number(numericSearch) }]
                : []),
              {
                customer: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
              {
                customer: {
                  phone: { contains: search, mode: "insensitive" as const },
                },
              },
              {
                team: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
              {
                lines: {
                  some: {
                    sku: { contains: search, mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      customer: true,
      team: true,
      payments: true,
      preorder: true,
      _count: { select: { lines: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });
  const paymentFilter = ["UNPAID", "PART_PAID", "PAID", "REFUNDED"].includes(
    filters.payment ?? "",
  )
    ? (filters.payment as PaymentStatus)
    : undefined;
  return paymentFilter
    ? orders.filter(
        (order) =>
          paymentSummary(order.total, order.payments).status === paymentFilter,
      )
    : orders;
}

export async function getOrder(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      customer: true,
      team: true,
      createdBy: { select: { name: true } },
      lines: { orderBy: { createdAt: "asc" } },
      payments: {
        include: { recordedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      preorder: {
        include: {
          purchaseOrder: {
            include: {
              supplier: true,
              lines: {
                include: {
                  shipmentLines: { include: { importShipment: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getCommerceDashboard() {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const [
    monthOrders,
    completedSales,
    recentOrders,
    attentionOrders,
    stock,
    lowStock,
  ] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { total: true, fulfilmentStatus: true, payments: true },
    }),
    db.order.findMany({
      where: {
        fulfilmentStatus: "COMPLETED",
        completedAt: { gte: monthStart },
      },
      select: { total: true },
    }),
    db.order.findMany({
      include: {
        customer: { select: { name: true } },
        team: { select: { name: true } },
        payments: true,
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.order.findMany({
      where: { fulfilmentStatus: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: {
        customer: { select: { name: true } },
        team: { select: { name: true } },
        payments: true,
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    db.productVariant.findMany({ select: { stockOnHand: true, cost: true } }),
    db.productVariant.findMany({
      where: { active: true },
      include: { product: { select: { name: true } } },
      orderBy: { stockOnHand: "asc" },
      take: 12,
    }),
  ]);
  const sales = completedSales.reduce(
    (sum, order) => sum.plus(order.total),
    new Prisma.Decimal(0),
  );
  const stockValue = stock.reduce(
    (sum, variant) =>
      variant.cost ? sum.plus(variant.cost.mul(variant.stockOnHand)) : sum,
    new Prisma.Decimal(0),
  );
  const attention = attentionOrders
    .map((order) => ({
      order,
      summary: paymentSummary(order.total, order.payments),
    }))
    .filter(
      ({ order, summary }) =>
        order.fulfilmentStatus !== "CANCELLED" &&
        (summary.status === "UNPAID" || summary.status === "PART_PAID"),
    )
    .slice(0, 4);
  return {
    monthOrders,
    sales,
    stockValue,
    recentOrders,
    attention,
    lowStock: lowStock
      .filter((variant) => variant.stockOnHand <= variant.reorderAt)
      .slice(0, 4),
  };
}
