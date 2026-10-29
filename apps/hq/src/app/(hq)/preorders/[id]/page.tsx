import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { OrderDetail } from "@/components/commerce/order-detail";
import { getOrder } from "@/lib/commerce/data";
import { requireStaff } from "@/lib/auth/session";
import { getOpenPurchaseOrdersForPreorder } from "@/lib/supply/data";
import { formatPurchaseOrderNumber } from "@set25/shared";
import { FileAttachmentsPanel } from "@/components/files/file-attachments-panel";
import { formatOrderNumber } from "@set25/shared";

export default async function PreorderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const [order, staff, query, purchaseOrders] = await Promise.all([
    getOrder(id),
    requireStaff(),
    searchParams,
    getOpenPurchaseOrdersForPreorder(),
  ]);
  if (!order) notFound();
  if (order.type !== "PREORDER") redirect(`/orders/${id}`);
  return (
    <OrderDetail
      preorder
      order={order}
      staff={staff}
      files={
        <FileAttachmentsPanel
          staff={staff}
          target={{ type: "ORDER", id: order.id }}
          targetLabel={formatOrderNumber(order.orderNumber)}
        />
      }
      paymentKey={randomUUID()}
      saved={typeof query.saved === "string" ? query.saved : undefined}
      purchaseOrders={purchaseOrders.map((po) => ({
        id: po.id,
        label: `${formatPurchaseOrderNumber(po.purchaseOrderNumber)} · ${po.supplier.name}`,
      }))}
    />
  );
}
