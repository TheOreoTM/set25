import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

if (process.env.NODE_ENV === "production") {
  throw new Error("The SET25 demo seed cannot run in production.");
}
if (process.env.ALLOW_DEMO_SEED !== "1") {
  throw new Error(
    "Run the intentional db:seed script to load clearly marked demo data.",
  );
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const products = [
  {
    name: "SET25 CORE",
    slug: "set25-core",
    code: "CORE",
    shortDescription: "Performance Knee Pads",
    description: "Demo catalogue record for SET25 performance knee pads.",
    category: "KNEE_PADS" as const,
    status: "ACTIVE" as const,
    retailPrice: "599.00",
    isPublished: true,
    brandLine: "Performance",
    variants: [
      {
        sku: "CORE-BLK-S",
        color: "Black",
        size: "S",
        cost: "240.00",
        reorderAt: 8,
        opening: 18,
      },
      {
        sku: "CORE-BLK-M",
        color: "Black",
        size: "M",
        cost: "240.00",
        reorderAt: 8,
        opening: 7,
      },
      {
        sku: "CORE-BLK-L",
        color: "Black",
        size: "L",
        cost: "240.00",
        reorderAt: 8,
        opening: 0,
      },
    ],
  },
  {
    name: "SET25 FLEX",
    slug: "set25-flex",
    code: "FLEX",
    shortDescription: "Compression Arm Sleeve",
    description: "Demo catalogue record for the SET25 compression arm sleeve.",
    category: "ARM_SLEEVES" as const,
    status: "ACTIVE" as const,
    retailPrice: "299.00",
    isPublished: true,
    brandLine: "Performance",
    variants: [
      {
        sku: "FLEX-BLK-M",
        color: "Black",
        size: "M",
        cost: "105.00",
        reorderAt: 10,
        opening: 24,
      },
    ],
  },
  {
    name: "SET25 TAPE",
    slug: "set25-tape",
    code: "TAPE",
    shortDescription: "Athletic Tape",
    description: "Demo catalogue record for SET25 athletic tape.",
    category: "ATHLETIC_TAPE" as const,
    status: "ACTIVE" as const,
    retailPrice: "89.00",
    isPublished: false,
    brandLine: "Essentials",
    variants: [
      {
        sku: "TAPE-WHT-STD",
        color: "White",
        size: "Standard",
        cost: "28.00",
        reorderAt: 20,
        opening: 42,
      },
    ],
  },
  {
    name: "SET25 GRIP",
    slug: "set25-grip",
    code: "GRIP",
    shortDescription: "Performance Grip Socks",
    description: "Demo catalogue record for SET25 performance grip socks.",
    category: "GRIP_SOCKS" as const,
    status: "DRAFT" as const,
    retailPrice: "249.00",
    isPublished: false,
    brandLine: "Performance",
    variants: [
      {
        sku: "GRIP-BLK-M",
        color: "Black",
        size: "M",
        cost: "92.00",
        reorderAt: 8,
        opening: 12,
      },
    ],
  },
];

for (const seedProduct of products) {
  const { variants, ...productData } = seedProduct;
  const product = await db.product.upsert({
    where: { code: productData.code },
    create: productData,
    update: productData,
  });

  for (const variantData of variants) {
    const { opening, ...data } = variantData;
    const variant = await db.productVariant.upsert({
      where: { sku: data.sku },
      create: { ...data, productId: product.id, active: true },
      update: { ...data, productId: product.id, active: true },
    });
    if (opening <= 0) continue;

    const idempotencyKey = `demo-seed-opening-${data.sku.toLowerCase()}-v1`;
    await db.$transaction(async (transaction) => {
      const exists = await transaction.inventoryMovement.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      if (exists) return;
      await transaction.productVariant.update({
        where: { id: variant.id },
        data: { stockOnHand: { increment: opening } },
      });
      await transaction.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: "OPENING_STOCK",
          quantityChange: opening,
          notes: "Clearly fake development opening stock.",
          reference: "DEMO-SEED",
          idempotencyKey,
        },
      });
    });
  }
}

console.info("Seeded SET25 demo products and auditable opening stock.");
await db.$disconnect();
