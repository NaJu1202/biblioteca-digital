import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  autorSchema,
  livroSchema,
  emprestimoSchema,
} from "../../src/schemas/index.js";

describe("Schema — Register", () => {
  it("deve aceitar dados válidos", () => {
    const result = registerSchema.safeParse({
      name: "João Silva",
      email: "joao@email.com",
      password: "senha123",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar email inválido", () => {
    const result = registerSchema.safeParse({
      name: "João",
      email: "nao-e-email",
      password: "senha123",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar senha com menos de 6 caracteres", () => {
    const result = registerSchema.safeParse({
      name: "João",
      email: "joao@email.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar nome com menos de 2 caracteres", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "joao@email.com",
      password: "senha123",
    });
    expect(result.success).toBe(false);
  });
});

describe("Schema — Login", () => {
  it("deve aceitar credenciais válidas", () => {
    const result = loginSchema.safeParse({
      email: "joao@email.com",
      password: "qualquercoisa",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar email mal formado", () => {
    const result = loginSchema.safeParse({ email: "invalido", password: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("Schema — Autor", () => {
  it("deve aceitar autor com nome e biografia", () => {
    const result = autorSchema.safeParse({
      nome: "Machado de Assis",
      biografia: "Escritor brasileiro.",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar autor sem biografia (campo opcional)", () => {
    const result = autorSchema.safeParse({ nome: "Clarice Lispector" });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar nome vazio", () => {
    const result = autorSchema.safeParse({ nome: "A" });
    expect(result.success).toBe(false);
  });
});

describe("Schema — Livro", () => {
  it("deve aceitar livro com todos os campos", () => {
    const result = livroSchema.safeParse({
      titulo: "Dom Casmurro",
      isbn: "9788598078465",
      anoPublicacao: 1899,
      autorId: 1,
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar ISBN muito curto", () => {
    const result = livroSchema.safeParse({
      titulo: "Dom Casmurro",
      isbn: "123",
      autorId: 1,
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar autorId negativo", () => {
    const result = livroSchema.safeParse({
      titulo: "Dom Casmurro",
      isbn: "9788598078465",
      autorId: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("Schema — Empréstimo", () => {
  it("deve aceitar livroId válido", () => {
    const result = emprestimoSchema.safeParse({ livroId: 5 });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar livroId zero", () => {
    const result = emprestimoSchema.safeParse({ livroId: 0 });
    expect(result.success).toBe(false);
  });
});
