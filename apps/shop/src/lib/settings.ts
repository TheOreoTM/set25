import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { db } from "@set25/database";

// Customer-safe Store configuration. Display reads may be up to a minute old;
// checkout always calls the fresh readers.

export type PublicStoreSettings = {
  storeOpen: boolean;
  announcement: string | null;
  supportPhone: string | null;
  supportWhatsApp: string | null;
  instagramHandle: string | null;
  bankTransferInstructions: string | null;
  deliveryInstructions: string | null;
  reservationHours: number;
};

export type PublicDeliveryOption = {
  id: string;
  name: string;
  description: string | null;
  price: string;
};

export async function readStoreSettings(): Promise<PublicStoreSettings> {
  const settings = await db.storeSettings.findUnique({
    where: { id: "store" },
    select: {
      storeOpen: true,
      announcement: true,
      supportPhone: true,
      supportWhatsApp: true,
      instagramHandle: true,
      bankTransferInstructions: true,
      deliveryInstructions: true,
      reservationHours: true,
    },
  });
  return (
    settings ?? {
      storeOpen: false,
      announcement: null,
      supportPhone: null,
      supportWhatsApp: null,
      instagramHandle: null,
      bankTransferInstructions: null,
      deliveryInstructions: null,
      reservationHours: 24,
    }
  );
}

export async function readDeliveryOptions(): Promise<PublicDeliveryOption[]> {
  const options = await db.deliveryOption.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, description: true, price: true },
  });
  return options.map((option) => ({
    ...option,
    price: option.price.toString(),
  }));
}

export async function getStoreSettings() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  cacheTag("store-settings");
  return readStoreSettings();
}

export function whatsAppUrl(number: string | null, text?: string) {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function instagramUrl(handle: string | null) {
  return handle ? `https://instagram.com/${handle}` : null;
}
