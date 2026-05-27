import { execSync } from "child_process";
import { prisma } from "../src/lib/prisma.js";
import process from "process";

// Garante que o banco de testes existe e está migrado
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "file:./prisma/test.db";
  process.env.JWT_SECRET = "test_secret_key_biblioteca";
  process.env.JWT_EXPIRES_IN = "1h";

  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
    stdio: "pipe",
  });
});

// Limpa todas as tabelas entre testes
beforeEach(async () => {
  await prisma.emprestimo.deleteMany();
  await prisma.livro.deleteMany();
  await prisma.autor.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
