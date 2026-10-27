import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../src/password";

const name = process.env.SET25_OWNER_NAME?.trim();
const username = process.env.SET25_OWNER_USERNAME?.trim().toLowerCase();
const password = process.env.SET25_OWNER_PASSWORD;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
if (!name || name.length < 2 || name.length > 80) {
  throw new Error("SET25_OWNER_NAME must contain 2–80 characters.");
}
// Same rule as STAFF_USERNAME_PATTERN in @set25/shared and the database check.
if (!username || !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
  throw new Error(
    "SET25_OWNER_USERNAME must be 3–32 letters, digits, dots, underscores, or hyphens, starting with a letter or digit.",
  );
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
    select: { username: true },
  });
  if (existingOwner) {
    throw new Error(
      `An Owner already exists (${existingOwner.username}). No account was changed.`,
    );
  }

  const existingUsername = await db.staffUser.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existingUsername) {
    throw new Error("That username already belongs to a staff account.");
  }

  await db.staffUser.create({
    data: {
      name,
      username,
      passwordHash: await hashPassword(password),
      role: "OWNER",
      active: true,
    },
  });
  console.info(`Created the initial SET25 Owner account "${username}".`);
} finally {
  await db.$disconnect();
}
