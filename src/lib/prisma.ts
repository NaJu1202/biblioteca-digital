import { PrismaClient } from "@prisma/client";

const databaseUrl =
  process.env.NODE_ENV === "test"
    ? "file:./prisma/test.db"
    : process.env.DATABASE_URL;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});
