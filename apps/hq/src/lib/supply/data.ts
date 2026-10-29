import "server-only";

import { db, Prisma } from "@set25/database";
import {
  IMPORT_SHIPMENT_STATUSES,
  PURCHASE_ORDER_STATUSES,
  SAMPLE_STATUSES,
  type ImportShipmentStatusValue,
  type PurchaseOrderStatusValue,
  type SampleStatusValue,
} from "@set25/shared";
import { calculateImportCosts } from "./costing";

export async function getSuppliers(
  filters: { search?: string; active?: string } = {},
) {
  const search = filters.search?.trim();
  const active =
    filters.active === "active"
      ? true
      : filters.active === "inactive"
        ? false
        : undefined;
  return db.supplier.findMany({
    where: {
      active,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { country: { contains: search, mode: "insensitive" as const } },
              {
                contactName: { contains: search, mode: "insensitive" as const },
              },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: { products: true, purchaseOrders: true, samples: true },
      },
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export function getSupplier(id: string) {
  return db.supplier.findUnique({
    where: { id },
    include: {
      products: {
        include: { product: true },
        orderBy: { product: { name: "asc" } },
      },
      purchaseOrders: {
        include: {
          _count: { select: { lines: true } },
          lines: {
            select: { quantityOrdered: true, quantityReceived: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      samples: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export function getSupplyProducts() {
  return db.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: { variants: { where: { active: true }, orderBy: { sku: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export function getActiveSuppliers() {
  return db.supplier.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function getPurchaseOrders(
  filters: { search?: string; status?: string } = {},
) {
  const status = PURCHASE_ORDER_STATUSES.includes(
    filters.status as PurchaseOrderStatusValue,
  )
    ? (filters.status as PurchaseOrderStatusValue)
    : undefined;
  const numericSearch = Number(filters.search?.replace(/\D/g, ""));
  return db.purchaseOrder.findMany({
    where: {
      status,
      ...(filters.search?.trim()
        ? {
            OR: [
              ...(Number.isInteger(numericSearch) && numericSearch > 0
                ? [{ purchaseOrderNumber: numericSearch }]
                : []),
              {
                supplier: {
                  name: {
                    contains: filters.search.trim(),
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                supplierReference: {
                  contains: filters.search.trim(),
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    },
    include: { supplier: true, lines: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getPurchaseOrder(id: string) {
  return db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdBy: { select: { name: true } },
      lines: {
        include: {
          variant: { include: { product: true } },
          shipmentLines: {
            include: { importShipment: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      preorders: { include: { order: { include: { customer: true } } } },
    },
  });
}

export async function getEligiblePurchaseOrderLines() {
  const lines = await db.purchaseOrderLine.findMany({
    where: { purchaseOrder: { status: "PLACED" }, variantId: { not: null } },
    include: {
      purchaseOrder: { include: { supplier: true } },
      variant: { include: { product: true } },
      shipmentLines: {
        where: {
          importShipment: { status: { notIn: ["CANCELLED", "RECEIVED"] } },
        },
        select: { quantityShipped: true },
      },
    },
    orderBy: [
      { purchaseOrder: { purchaseOrderNumber: "asc" } },
      { createdAt: "asc" },
    ],
  });
  return lines
    .map((line) => ({
      ...line,
      remainingToShip:
        line.quantityOrdered -
        line.quantityReceived -
        line.shipmentLines.reduce(
          (sum, shipment) => sum + shipment.quantityShipped,
          0,
        ),
    }))
    .filter((line) => line.remainingToShip > 0);
}

export async function getImports(
  filters: { search?: string; status?: string } = {},
) {
  const status = IMPORT_SHIPMENT_STATUSES.includes(
    filters.status as ImportShipmentStatusValue,
  )
    ? (filters.status as ImportShipmentStatusValue)
    : undefined;
  const search = filters.search?.trim();
  const numericSearch = Number(search?.replace(/\D/g, ""));
  return db.importShipment.findMany({
    where: {
      status,
      ...(search
        ? {
            OR: [
              ...(Number.isInteger(numericSearch) && numericSearch > 0
                ? [{ importNumber: numericSearch }]
                : []),
              {
                trackingReference: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                freightForwarder: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    },
    include: {
      lines: {
        include: {
          purchaseOrderLine: {
            include: { purchaseOrder: { include: { supplier: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getImport(id: string) {
  const shipment = await db.importShipment.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      lines: {
        include: {
          purchaseOrderLine: {
            include: {
              purchaseOrder: { include: { supplier: true } },
              variant: { include: { product: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      events: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!shipment) return null;
  const sharedCost = shipment.chinaShippingMvr
    .add(shipment.internationalShippingMvr)
    .add(shipment.taxFeesMvr)
    .add(shipment.otherFeesMvr);
  const preview = calculateImportCosts(
    shipment.lines.map((line) => ({
      id: line.id,
      quantity:
        shipment.status === "RECEIVED"
          ? line.quantityReceived
          : line.quantityShipped,
      unitCost: line.purchaseOrderLine.unitCost,
      exchangeRateToMvr: line.purchaseOrderLine.purchaseOrder.exchangeRateToMvr,
    })),
    sharedCost,
    shipment.costAllocationMethod,
  );
  return { ...shipment, preview };
}

export async function getSamples(
  filters: { search?: string; status?: string } = {},
) {
  const status = SAMPLE_STATUSES.includes(filters.status as SampleStatusValue)
    ? (filters.status as SampleStatusValue)
    : undefined;
  return db.sample.findMany({
    where: {
      status,
      ...(filters.search?.trim()
        ? {
            OR: [
              {
                name: {
                  contains: filters.search.trim(),
                  mode: "insensitive" as const,
                },
              },
              {
                supplier: {
                  name: {
                    contains: filters.search.trim(),
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                product: {
                  name: {
                    contains: filters.search.trim(),
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      supplier: true,
      product: true,
      _count: { select: { evaluations: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getSample(id: string) {
  return db.sample.findUnique({
    where: { id },
    include: {
      supplier: true,
      product: true,
      variant: true,
      createdBy: { select: { name: true } },
      evaluations: {
        include: { recordedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getIncomingByVariant(variantIds?: string[]) {
  const lines = await db.purchaseOrderLine.findMany({
    where: {
      purchaseOrder: { status: "PLACED" },
      variantId: { not: null, ...(variantIds ? { in: variantIds } : {}) },
    },
    select: { variantId: true, quantityOrdered: true, quantityReceived: true },
  });
  const result = new Map<string, number>();
  for (const line of lines) {
    if (!line.variantId) continue;
    result.set(
      line.variantId,
      (result.get(line.variantId) ?? 0) +
        line.quantityOrdered -
        line.quantityReceived,
    );
  }
  return result;
}

export async function getOpenPurchaseOrdersForPreorder() {
  return db.purchaseOrder.findMany({
    where: { status: { in: ["DRAFT", "PLACED"] } },
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSupplyDashboard() {
  const [shipments, unassignedPurchaseOrders] = await Promise.all([
    db.importShipment.findMany({
      where: {
        status: {
          in: [
            "CHINA_WAREHOUSE",
            "READY_TO_SHIP",
            "IN_TRANSIT",
            "MALDIVES_CUSTOMS",
            "READY_FOR_COLLECTION",
          ],
        },
      },
      include: {
        lines: { select: { quantityShipped: true } },
      },
      orderBy: [{ estimatedArrival: "asc" }, { createdAt: "desc" }],
      take: 5,
    }),
    db.purchaseOrder.findMany({
      where: {
        status: "PLACED",
        lines: {
          none: {
            shipmentLines: {
              some: { importShipment: { status: { not: "CANCELLED" } } },
            },
          },
        },
      },
      include: { supplier: true },
      orderBy: { placedAt: "asc" },
      take: 3,
    }),
  ]);
  const now = new Date();
  return {
    shipments,
    attention: [
      ...shipments.filter(
        (shipment) =>
          ["READY_TO_SHIP", "READY_FOR_COLLECTION"].includes(shipment.status) ||
          (shipment.estimatedArrival && shipment.estimatedArrival < now),
      ),
    ],
    unassignedPurchaseOrders,
  };
}

export function decimalTotal(
  lines: { unitCost: Prisma.Decimal; quantityOrdered: number }[],
) {
  return lines.reduce(
    (total, line) => total.add(line.unitCost.mul(line.quantityOrdered)),
    new Prisma.Decimal(0),
  );
}

/** Dashboard: samples still waiting for an approve / reject decision. */
export async function getSamplesAwaitingDecision() {
  const where: Prisma.SampleWhereInput = {
    status: { in: ["PENDING", "RETEST"] },
  };
  const [samples, count] = await Promise.all([
    db.sample.findMany({
      where,
      select: {
        id: true,
        sampleNumber: true,
        name: true,
        status: true,
        receivedAt: true,
        supplier: { select: { name: true } },
        _count: { select: { evaluations: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    db.sample.count({ where }),
  ]);
  return { samples, count };
}
