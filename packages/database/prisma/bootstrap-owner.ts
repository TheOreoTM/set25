import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../src/password";

const name = process.env.SET25_OWNER_NAME?.trim();
const email = process.env.SET25_OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.SET25_OWNER_PASSWORD;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
if (!name || name.length < 2 || name.length > 80) {
  throw new Error("SET25_OWNER_NAME must contain 2–80 characters.");
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("SET25_OWNER_EMAIL must be a valid email address.");
}
if (!password || password.length < 12 || password.length > 128) {
  throw new Error("SET25_OWNER_PASSWORD must contain 12–128 characters.");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const existingOwner = await db.staffUser.findFirst({
    where: { role: "OWNER" },
    select: { email: true },
  });
  if (existingOwner) {
    throw new Error(
      `An Owner already exists (${existingOwner.email}). No account was changed.`,
    );
  }

  const existingEmail = await db.staffUser.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingEmail) {
    throw new Error("That email already belongs to a staff account.");
  }

  await db.staffUser.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "OWNER",
      active: true,
    },
  });
  console.info(`Created the initial SET25 Owner account for ${email}.`);
} finally {
  await db.$disconnect();
}
