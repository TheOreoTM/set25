"use server";

import { db, Prisma } from "@set25/database";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireOperationalAccess } from "@/lib/auth/session";
import { calculateImportCosts, weightedAverageCost } from "./costing";
import {
  field,
  validateEvaluation,
  validateImport,
  validatePurchaseOrder,
  validateSample,
  validateSampleStatus,
  validateShipmentCosts,
  validateShipmentStatus,
  validateSupplier,
  validateSupplierProduct,
  type SupplyFormState,
} from "./validation";

class SupplyRuleError extends Error {}

function fail(error: unknown): SupplyFormState {
  unstable_rethrow(error);
  if (error instanceof SupplyRuleError)
    return { status: "error", message: error.message };
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    return {
      status: "error",
      message:
        "That record already exists or this submission was already processed.",
    };
  console.error(error);
  return {
    status: "error",
    message: "SET25 HQ could not save this supply change. Please try again.",
  };
}

function invalid(errors: Record<string, string[]>): SupplyFormState {
  return { status: "error", message: "Check the highlighted details.", errors };
}

export async function createSupplierAction(
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  await requireOperationalAccess();
  const result = validateSupplier(formData);
  if (!result.success) return invalid(result.errors);
  try {
    const supplier = await db.supplier.create({
      data: result.data,
      select: { id: true },
    });
    revalidatePath("/suppliers");
    redirect(`/suppliers/${supplier.id}`);
  } catch (error) {
    return fail(error);
  }
}

export async function updateSupplierAction(
  id: string,
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  await requireOperationalAccess();
  const result = validateSupplier(formData);
  if (!result.success) return invalid(result.errors);
  try {
    await db.supplier.update({ where: { id }, data: result.data });
    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    redirect(`/suppliers/${id}?saved=supplier`);
  } catch (error) {
    return fail(error);
  }
}

export async function addSupplierProductAction(
  supplierId: string,
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  await requireOperationalAccess();
  const result = validateSupplierProduct(formData);
  if (!result.success) return invalid(result.errors);
  try {
    const [supplier, product] = await Promise.all([
      db.supplier.findUnique({
        where: { id: supplierId },
        select: { id: true },
      }),
      db.product.findUnique({
        where: { id: result.data.productId },
        select: { id: true },
      }),
    ]);
    if (!supplier || !product)
      throw new SupplyRuleError("The supplier or product no longer exists.");
    await db.supplierProduct.upsert({
      where: {
        supplierId_productId: { supplierId, productId: result.data.productId },
      },
      create: { ...result.data, supplierId },
      update: result.data,
    });
    revalidatePath(`/suppliers/${supplierId}`);
    redirect(`/suppliers/${supplierId}?saved=terms`);
  } catch (error) {
    return fail(error);
  }
}

async function purchaseOrderData(formData: FormData) {
  const result = validatePurchaseOrder(formData);
  if (!result.success) return result;
  const variants = await db.productVariant.findMany({
    where: {
      id: { in: result.data.lines.map((line) => line.variantId) },
      active: true,
    },
    include: { product: true },
  });
  if (variants.length !== result.data.lines.length)
    return {
      success: false as const,
      errors: { lines: ["One or more variants are unavailable."] },
    };
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
  return {
    success: true as const,
    data: result.data,
    lines: result.data.lines.map((line) => {
      const variant = variantMap.get(line.variantId)!;
      return {
        variantId: variant.id,
        productName: variant.product.name,
        productCode: variant.product.code,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        quantityOrdered: line.quantity,
        unitCost: line.unitCost,
        currency: result.data.currency,
      };
    }),
  };
}

export async function createPurchaseOrderAction(
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  const staff = await requireOperationalAccess();
  const result = await purchaseOrderData(formData);
  if (!result.success) return invalid(result.errors);
  if (!result.data.idempotencyKey)
    return invalid({ lines: ["Refresh the form and try again."] });
  try {
    const supplier = await db.supplier.findFirst({
      where: { id: result.data.supplierId, active: true },
      select: { id: true },
    });
    if (!supplier) throw new SupplyRuleError("Choose an active supplier.");
    const po = await db.purchaseOrder.create({
      data: {
        supplierId: supplier.id,
        currency: result.data.currency,
        exchangeRateToMvr: result.data.exchangeRateToMvr,
        supplierReference: result.data.supplierReference,
        expectedAt: result.data.expectedAt,
        notes: result.data.notes,
        idempotencyKey: result.data.idempotencyKey,
        createdById: staff.id,
        lines: { create: result.lines },
      },
      select: { id: true },
    });
    revalidatePath("/purchase-orders");
    redirect(`/purchase-orders/${po.id}`);
  } catch (error) {
    return fail(error);
  }
}

export async function updatePurchaseOrderAction(
  id: string,
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  await requireOperationalAccess();
  const result = await purchaseOrderData(formData);
  if (!result.success) return invalid(result.errors);
  try {
    await db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { lines: { include: { shipmentLines: true } } },
      });
      if (!po)
        throw new SupplyRuleError("That purchase order no longer exists.");
      if (po.status !== "DRAFT")
        throw new SupplyRuleError(
          "Only draft purchase orders can be rewritten.",
        );
      const supplier = await tx.supplier.findFirst({
        where: { id: result.data.supplierId, active: true },
        select: { id: true },
      });
      if (!supplier) throw new SupplyRuleError("Choose an active supplier.");
      if (po.lines.some((line) => line.shipmentLines.length))
        throw new SupplyRuleError(
          "This purchase order already has shipment history.",
        );
      await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
      await tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: result.data.supplierId,
          currency: result.data.currency,
          exchangeRateToMvr: result.data.exchangeRateToMvr,
          supplierReference: result.data.supplierReference,
          expectedAt: result.data.expectedAt,
          notes: result.data.notes,
          lines: { create: result.lines },
        },
      });
    });
    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${id}`);
    redirect(`/purchase-orders/${id}?saved=po`);
  } catch (error) {
    return fail(error);
  }
}

export async function changePurchaseOrderStatusAction(
  id: string,
  status: "PLACED" | "CANCELLED",
  _state: SupplyFormState,
  _formData: FormData,
): Promise<SupplyFormState> {
  void _state;
  void _formData;
  await requireOperationalAccess();
  try {
    await db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          lines: {
            include: { shipmentLines: { include: { importShipment: true } } },
          },
        },
      });
      if (!po)
        throw new SupplyRuleError("That purchase order no longer exists.");
      if (status === "PLACED" && po.status !== "DRAFT")
        throw new SupplyRuleError("Only a draft purchase order can be placed.");
      if (status === "CANCELLED") {
        if (!(["DRAFT", "PLACED"] as string[]).includes(po.status))
          throw new SupplyRuleError(
            "This purchase order can no longer be cancelled.",
          );
        if (
          po.lines.some(
            (line) =>
              line.quantityReceived > 0 ||
              line.shipmentLines.some(
                (shipmentLine) =>
                  shipmentLine.importShipment.status !== "CANCELLED",
              ),
          )
        )
          throw new SupplyRuleError(
            "Cancel its active shipment before cancelling this purchase order.",
          );
      }
      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status,
          placedAt: status === "PLACED" ? new Date() : po.placedAt,
        },
      });
    });
    revalidatePath("/purchase-orders");
    revalidatePath("/stock");
    revalidatePath(`/purchase-orders/${id}`);
    redirect(`/purchase-orders/${id}?saved=status`);
  } catch (error) {
    return fail(error);
  }
}

export async function createImportAction(
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  const staff = await requireOperationalAccess();
  const result = validateImport(formData);
  if (!result.success) return invalid(result.errors);
  if (!result.data.idempotencyKey)
    return invalid({ lines: ["Refresh the form and try again."] });
  try {
    const shipmentId = await db.$transaction(
      async (tx) => {
        const poLines = await tx.purchaseOrderLine.findMany({
          where: {
            id: {
              in: result.data.lines.map((line) => line.purchaseOrderLineId),
            },
          },
          include: {
            purchaseOrder: true,
            shipmentLines: {
              where: {
                importShipment: {
                  status: { notIn: ["CANCELLED", "RECEIVED"] },
                },
              },
            },
          },
        });
        if (
          poLines.length !== result.data.lines.length ||
          poLines.some(
            (line) => line.purchaseOrder.status !== "PLACED" || !line.variantId,
          )
        )
          throw new SupplyRuleError(
            "Every shipment line must come from a placed purchase order with a live variant.",
          );
        const requested = new Map(
          result.data.lines.map((line) => [
            line.purchaseOrderLineId,
            line.quantityShipped,
          ]),
        );
        for (const line of poLines) {
          const allocated = line.shipmentLines.reduce(
            (sum, item) => sum + item.quantityShipped,
            0,
          );
          const remaining =
            line.quantityOrdered - line.quantityReceived - allocated;
          if ((requested.get(line.id) ?? 0) > remaining)
            throw new SupplyRuleError(
              `${line.sku} has only ${remaining} units left to assign.`,
            );
        }
        const shipment = await tx.importShipment.create({
          data: {
            freightForwarder: result.data.freightForwarder,
            trackingReference: result.data.trackingReference,
            estimatedDeparture: result.data.estimatedDeparture,
            estimatedArrival: result.data.estimatedArrival,
            costAllocationMethod: result.data.costAllocationMethod,
            notes: result.data.notes,
            idempotencyKey: result.data.idempotencyKey,
            createdById: staff.id,
            lines: { create: result.data.lines },
            events: {
              create: {
                status: "PLANNING",
                notes: "Import created",
                createdById: staff.id,
              },
            },
          },
          select: { id: true },
        });
        return shipment.id;
      },
      { isolationLevel: "Serializable" },
    );
    revalidatePath("/imports");
    redirect(`/imports/${shipmentId}`);
  } catch (error) {
    return fail(error);
  }
}

export async function updateShipmentCostsAction(
  id: string,
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  await requireOperationalAccess();
  const result = validateShipmentCosts(formData);
  if (!result.success) return invalid(result.errors);
  try {
    const shipment = await db.importShipment.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!shipment) throw new SupplyRuleError("That import no longer exists.");
    if (["RECEIVED", "CANCELLED"].includes(shipment.status))
      throw new SupplyRuleError(
        "Historical or cancelled import costs cannot be edited.",
      );
    await db.importShipment.update({ where: { id }, data: result.data });
    revalidatePath(`/imports/${id}`);
    redirect(`/imports/${id}?saved=costs`);
  } catch (error) {
    return fail(error);
  }
}

export async function changeShipmentStatusAction(
  id: string,
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  const staff = await requireOperationalAccess();
  const result = validateShipmentStatus(formData);
  if (!result.success) return invalid(result.errors);
  try {
    await db.$transaction(async (tx) => {
      const shipment = await tx.importShipment.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!shipment) throw new SupplyRuleError("That import no longer exists.");
      if (["RECEIVED", "CANCELLED"].includes(shipment.status))
        throw new SupplyRuleError("This import is a locked historical record.");
      if (result.data.status === "RECEIVED")
        throw new SupplyRuleError(
          "Use Receive Shipment so stock and costs are applied safely.",
        );
      const journey = [
        "PLANNING",
        "SUPPLIER_SHIPPING",
        "CHINA_WAREHOUSE",
        "READY_TO_SHIP",
        "IN_TRANSIT",
        "MALDIVES_CUSTOMS",
        "READY_FOR_COLLECTION",
      ];
      if (
        result.data.status !== "CANCELLED" &&
        journey.indexOf(result.data.status) <= journey.indexOf(shipment.status)
      )
        throw new SupplyRuleError(
          "Shipment status must move forward. Use the event note to explain skipped stages.",
        );
      const dateChanges =
        result.data.status === "IN_TRANSIT"
          ? { departedAt: new Date() }
          : result.data.status === "MALDIVES_CUSTOMS"
            ? { arrivedAt: new Date() }
            : {};
      await tx.importShipment.update({
        where: { id },
        data: { status: result.data.status, ...dateChanges },
      });
      await tx.importShipmentEvent.create({
        data: {
          importShipmentId: id,
          status: result.data.status,
          notes: result.data.notes,
          createdById: staff.id,
        },
      });
    });
    revalidatePath("/");
    revalidatePath("/imports");
    revalidatePath(`/imports/${id}`);
    redirect(`/imports/${id}?saved=status`);
  } catch (error) {
    return fail(error);
  }
}

export async function receiveShipmentAction(
  id: string,
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  const staff = await requireOperationalAccess();
  try {
    await db.$transaction(
      async (tx) => {
        const shipment = await tx.importShipment.findUnique({
          where: { id },
          include: {
            lines: {
              include: {
                purchaseOrderLine: {
                  include: { purchaseOrder: true, variant: true },
                },
              },
            },
          },
        });
        if (!shipment)
          throw new SupplyRuleError("That import no longer exists.");
        if (shipment.status === "RECEIVED") return;
        if (shipment.status === "CANCELLED")
          throw new SupplyRuleError("A cancelled import cannot be received.");
        if (!shipment.lines.length)
          throw new SupplyRuleError("This import has no lines to receive.");
        const receiptLines = shipment.lines.map((line) => {
          const quantity = Number(field(formData, `received:${line.id}`));
          if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > line.quantityShipped
          )
            throw new SupplyRuleError(
              `Received quantity for ${line.purchaseOrderLine.sku} must be between 1 and ${line.quantityShipped}.`,
            );
          if (
            !line.purchaseOrderLine.variantId ||
            !line.purchaseOrderLine.variant
          )
            throw new SupplyRuleError(
              `${line.purchaseOrderLine.sku} is no longer linked to a catalogue variant.`,
            );
          if (
            line.purchaseOrderLine.quantityReceived + quantity >
            line.purchaseOrderLine.quantityOrdered
          )
            throw new SupplyRuleError(
              `${line.purchaseOrderLine.sku} would exceed its ordered quantity.`,
            );
          return { source: line, quantity };
        });
        const shared = shipment.chinaShippingMvr
          .add(shipment.internationalShippingMvr)
          .add(shipment.taxFeesMvr)
          .add(shipment.otherFeesMvr);
        const costs = calculateImportCosts(
          receiptLines.map(({ source, quantity }) => ({
            id: source.id,
            quantity,
            unitCost: source.purchaseOrderLine.unitCost,
            exchangeRateToMvr:
              source.purchaseOrderLine.purchaseOrder.exchangeRateToMvr,
          })),
          shared,
          shipment.costAllocationMethod,
        );
        const costMap = new Map(costs.lines.map((line) => [line.id, line]));
        for (const { source, quantity } of receiptLines) {
          const movementKey = `import:${shipment.id}:line:${source.id}:receive`;
          const duplicate = await tx.inventoryMovement.findUnique({
            where: { idempotencyKey: movementKey },
            select: { id: true },
          });
          if (duplicate)
            throw new SupplyRuleError(
              "This shipment receipt was already applied.",
            );
          const variant = source.purchaseOrderLine.variant!;
          const cost = costMap.get(source.id)!;
          const averageCost = weightedAverageCost(
            variant.stockOnHand,
            variant.cost,
            quantity,
            cost.actualUnitCostMvr,
          );
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stockOnHand: { increment: quantity }, cost: averageCost },
          });
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "PURCHASE_RECEIVED",
              quantityChange: quantity,
              notes: "Stock received through an import shipment.",
              reference: `IMP-${String(shipment.importNumber).padStart(6, "0")}`,
              idempotencyKey: movementKey,
              createdById: staff.id,
            },
          });
          await tx.purchaseOrderLine.update({
            where: { id: source.purchaseOrderLineId },
            data: { quantityReceived: { increment: quantity } },
          });
          await tx.importShipmentLine.update({
            where: { id: source.id },
            data: {
              quantityReceived: quantity,
              allocatedSharedCostMvr: cost.allocatedSharedCostMvr,
              actualUnitCostMvr: cost.actualUnitCostMvr,
            },
          });
        }
        await tx.importShipment.update({
          where: { id },
          data: { status: "RECEIVED", receivedAt: new Date() },
        });
        await tx.importShipmentEvent.create({
          data: {
            importShipmentId: id,
            status: "RECEIVED",
            notes: "Shipment received and stock applied",
            createdById: staff.id,
          },
        });
        const poIds = [
          ...new Set(
            receiptLines.map(
              ({ source }) => source.purchaseOrderLine.purchaseOrderId,
            ),
          ),
        ];
        for (const poId of poIds) {
          const poLines = await tx.purchaseOrderLine.findMany({
            where: { purchaseOrderId: poId },
            select: { quantityOrdered: true, quantityReceived: true },
          });
          if (
            poLines.length &&
            poLines.every(
              (line) => line.quantityReceived >= line.quantityOrdered,
            )
          )
            await tx.purchaseOrder.update({
              where: { id: poId },
              data: { status: "CLOSED" },
            });
        }
      },
      { isolationLevel: "Serializable" },
    );
    revalidatePath("/");
    revalidatePath("/stock");
    revalidatePath("/products");
    revalidatePath("/purchase-orders");
    revalidatePath("/imports");
    revalidatePath(`/imports/${id}`);
    redirect(`/imports/${id}?received=1`);
  } catch (error) {
    return fail(error);
  }
}

export async function createSampleAction(
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  const staff = await requireOperationalAccess();
  const result = validateSample(formData);
  if (!result.success) return invalid(result.errors);
  try {
    const [supplier, product, variant] = await Promise.all([
      db.supplier.findFirst({
        where: { id: result.data.supplierId, active: true },
        select: { id: true },
      }),
      result.data.productId
        ? db.product.findUnique({
            where: { id: result.data.productId },
            select: { id: true },
          })
        : null,
      result.data.variantId
        ? db.productVariant.findUnique({
            where: { id: result.data.variantId },
            select: { id: true, productId: true },
          })
        : null,
    ]);
    if (!supplier) throw new SupplyRuleError("Choose an active supplier.");
    if (result.data.productId && !product)
      throw new SupplyRuleError("That product no longer exists.");
    if (result.data.variantId && !variant)
      throw new SupplyRuleError("That variant no longer exists.");
    if (product && variant && product.id !== variant.productId)
      throw new SupplyRuleError(
        "The selected variant does not belong to that product.",
      );
    const sample = await db.sample.create({
      data: {
        ...result.data,
        productId: product?.id ?? variant?.productId ?? null,
        variantId: variant?.id ?? null,
        createdById: staff.id,
      },
      select: { id: true },
    });
    revalidatePath("/samples");
    redirect(`/samples/${sample.id}`);
  } catch (error) {
    return fail(error);
  }
}

export async function addSampleEvaluationAction(
  sampleId: string,
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  const staff = await requireOperationalAccess();
  const result = validateEvaluation(formData);
  if (!result.success) return invalid(result.errors);
  try {
    await db.sampleEvaluation.create({
      data: { ...result.data, sampleId, recordedById: staff.id },
    });
    revalidatePath(`/samples/${sampleId}`);
    redirect(`/samples/${sampleId}?saved=evaluation`);
  } catch (error) {
    return fail(error);
  }
}

export async function changeSampleStatusAction(
  sampleId: string,
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  await requireOperationalAccess();
  const result = validateSampleStatus(formData);
  if (!result.success)
    return { status: "error", message: "Choose a valid sample status." };
  try {
    await db.sample.update({
      where: { id: sampleId },
      data: { status: result.data },
    });
    revalidatePath("/samples");
    revalidatePath(`/samples/${sampleId}`);
    redirect(`/samples/${sampleId}?saved=status`);
  } catch (error) {
    return fail(error);
  }
}

export async function linkPreorderPurchaseOrderAction(
  preorderId: string,
  _state: SupplyFormState,
  formData: FormData,
): Promise<SupplyFormState> {
  await requireOperationalAccess();
  const purchaseOrderId = field(formData, "purchaseOrderId") || null;
  try {
    if (purchaseOrderId) {
      const po = await db.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        select: { id: true },
      });
      if (!po)
        throw new SupplyRuleError("That purchase order no longer exists.");
    }
    const preorder = await db.preorderDetail.update({
      where: { id: preorderId },
      data: {
        purchaseOrderId,
        ...(purchaseOrderId ? { supplierOrdered: true } : {}),
      },
      select: { orderId: true },
    });
    revalidatePath(`/preorders/${preorder.orderId}`);
    redirect(`/preorders/${preorder.orderId}?saved=supply`);
  } catch (error) {
    return fail(error);
  }
}
