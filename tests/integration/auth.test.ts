import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

const app = createApp();

describe("Auth — Registro", () => {
  it("deve registrar um novo usuário com sucesso", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Maria Silva",
      email: "maria@email.com",
      password: "senha123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Maria Silva",
      email: "maria@email.com",
      role: "USER",
    });
    expect(res.body).not.toHaveProperty("password");
  });

  it("deve rejeitar registro com email duplicado", async () => {
    await request(app).post("/auth/register").send({
      name: "Maria Silva",
      email: "maria@email.com",
      password: "senha123",
    });

    const res = await request(app).post("/auth/register").send({
      name: "Outro Nome",
      email: "maria@email.com",
      password: "outrasenha",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email já cadastrado/i);
  });

  it("deve rejeitar registro com senha muito curta", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "João",
      email: "joao@email.com",
      password: "123",
    });

    expect(res.status).toBe(422);
  });

  it("deve rejeitar registro com email inválido", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "João",
      email: "nao-e-email",
      password: "senha123",
    });

    expect(res.status).toBe(422);
  });
});

describe("Auth — Login", () => {
  it("deve fazer login com sucesso e retornar token JWT", async () => {
    await request(app).post("/auth/register").send({
      name: "Pedro",
      email: "pedro@email.com",
      password: "senha123",
    });

    const res = await request(app).post("/auth/login").send({
      email: "pedro@email.com",
      password: "senha123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("deve rejeitar login com senha incorreta", async () => {
    await request(app).post("/auth/register").send({
      name: "Pedro",
      email: "pedro@email.com",
      password: "senha123",
    });

    const res = await request(app).post("/auth/login").send({
      email: "pedro@email.com",
      password: "senhaerrada",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciais inválidas/i);
  });

  it("deve rejeitar login com email não cadastrado", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "naoexiste@email.com",
      password: "senha123",
    });

    expect(res.status).toBe(401);
  });
});

describe("Auth — /me", () => {
  it("deve retornar dados do usuário autenticado", async () => {
    await request(app).post("/auth/register").send({
      name: "Ana",
      email: "ana@email.com",
      password: "senha123",
    });

    const loginRes = await request(app).post("/auth/login").send({
      email: "ana@email.com",
      password: "senha123",
    });

    const token = loginRes.body.token;

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("ana@email.com");
    expect(res.body).not.toHaveProperty("password");
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("deve retornar 401 com token inválido", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer token.invalido.aqui");
    expect(res.status).toBe(401);
  });
});
