import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { OrderDetail } from "@/components/commerce/order-detail";
import { getOrder } from "@/lib/commerce/data";
import { requireStaff } from "@/lib/auth/session";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const [order, staff, query] = await Promise.all([
    getOrder(id),
    requireStaff(),
    searchParams,
  ]);
  if (!order) notFound();
  if (order.type === "PREORDER") redirect(`/preorders/${id}`);
  return (
    <OrderDetail
      order={order}
      staff={staff}
      paymentKey={randomUUID()}
      saved={typeof query.saved === "string" ? query.saved : undefined}
    />
  );
}
