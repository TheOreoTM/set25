import "server-only";

import { db } from "@set25/database";

export async function getStoreSettingsForHq() {
  const [settings, deliveryOptions] = await Promise.all([
    db.storeSettings.findUnique({
      where: { id: "store" },
      include: { updatedBy: { select: { name: true } } },
    }),
    db.deliveryOption.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { deliveries: true } } },
    }),
  ]);
  return { settings, deliveryOptions };
}
