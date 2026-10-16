import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export { Prisma } from "../generated/prisma/client";
export {
  InventoryMovementType,
  FulfilmentStatus,
  OrderSource,
  OrderType,
  PaymentMethod,
  PaymentType,
  PreorderStatus,
  ProductCategory,
  ProductStatus,
  StaffRole,
  TeamType,
} from "../generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString,
});

const globalForPrisma = globalThis as unknown as {
  db?: PrismaClient;
};

export const db =
  globalForPrisma.db ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
}
