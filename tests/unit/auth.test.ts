import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../../src/lib/auth.js";

describe("Auth Helpers — Senha", () => {
  it("deve gerar um hash diferente do texto original", async () => {
    const plain = "senha123";
    const hashed = await hashPassword(plain);
    expect(hashed).not.toBe(plain);
    expect(hashed.length).toBeGreaterThan(10);
  });

  it("deve gerar hashes diferentes para a mesma senha (salt único)", async () => {
    const plain = "senha123";
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);
    expect(hash1).not.toBe(hash2);
  });

  it("deve verificar senha correta com sucesso", async () => {
    const plain = "minhasenha";
    const hashed = await hashPassword(plain);
    const resultado = await verifyPassword(plain, hashed);
    expect(resultado).toBe(true);
  });

  it("deve rejeitar senha incorreta", async () => {
    const hashed = await hashPassword("correta");
    const resultado = await verifyPassword("errada", hashed);
    expect(resultado).toBe(false);
  });

  it("deve rejeitar string vazia como senha", async () => {
    const hashed = await hashPassword("correta");
    const resultado = await verifyPassword("", hashed);
    expect(resultado).toBe(false);
  });
});

describe("Auth Helpers — Token JWT", () => {
  const payload = { sub: 1, email: "teste@email.com", role: "USER" };

  it("deve assinar e retornar um token string", () => {
    const token = signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
  });

  it("deve decodificar corretamente o payload", () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("deve lançar erro ao verificar token inválido", () => {
    expect(() => verifyToken("token.invalido.aqui")).toThrow();
  });

  it("deve lançar erro ao verificar token com assinatura adulterada", () => {
    const token = signToken(payload);
    const partes = token.split(".");
    partes[2] = "assinaturaadulterada";
    expect(() => verifyToken(partes.join("."))).toThrow();
  });
});
