import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { hashPassword } from "../../src/lib/auth.js";

const app = createApp();

async function criarAdmin() {
  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@biblioteca.com",
      password: await hashPassword("admin123"),
      role: "ADMIN",
    },
  });

  const res = await request(app).post("/auth/login").send({
    email: "admin@biblioteca.com",
    password: "admin123",
  });

  return { user, token: res.body.token as string };
}

async function criarUser() {
  await request(app).post("/auth/register").send({
    name: "Usuario Comum",
    email: "user@email.com",
    password: "senha123",
  });

  const res = await request(app).post("/auth/login").send({
    email: "user@email.com",
    password: "senha123",
  });

  return res.body.token as string;
}

describe("Autores — CRUD (ADMIN)", () => {
  it("deve criar autor com sucesso (ADMIN)", async () => {
    const { token } = await criarAdmin();

    const res = await request(app)
      .post("/autores")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Machado de Assis", biografia: "Escritor brasileiro" });

    expect(res.status).toBe(201);
    expect(res.body.nome).toBe("Machado de Assis");
  });

  it("deve retornar 403 ao tentar criar autor como USER comum", async () => {
    const token = await criarUser();

    const res = await request(app)
      .post("/autores")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Alguém" });

    expect(res.status).toBe(403);
  });

  it("deve listar autores sem autenticação (rota pública)", async () => {
    const res = await request(app).get("/autores");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
  });

  it("deve atualizar autor (ADMIN)", async () => {
    const { token } = await criarAdmin();

    const criado = await request(app)
      .post("/autores")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Clarice Lispector" });

    const res = await request(app)
      .put(`/autores/${criado.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Clarice Lispector (atualizado)" });

    expect(res.status).toBe(200);
    expect(res.body.nome).toContain("atualizado");
  });

  it("deve retornar 404 ao buscar autor inexistente", async () => {
    const res = await request(app).get("/autores/99999");
    expect(res.status).toBe(404);
  });

  it("deve deletar autor (ADMIN)", async () => {
    const { token } = await criarAdmin();

    const criado = await request(app)
      .post("/autores")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Autor para deletar" });

    const res = await request(app)
      .delete(`/autores/${criado.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});

describe("Livros — CRUD (ADMIN) + relacionamento", () => {
  let adminToken: string;
  let autorId: number;

  beforeEach(async () => {
    const admin = await criarAdmin();
    adminToken = admin.token;

    const autorRes = await request(app)
      .post("/autores")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ nome: "Jorge Amado" });

    autorId = autorRes.body.id;
  });

  it("deve criar livro com autor relacionado", async () => {
    const res = await request(app)
      .post("/livros")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        titulo: "Gabriela, Cravo e Canela",
        isbn: "9788535910681",
        anoPublicacao: 1958,
        autorId,
      });

    expect(res.status).toBe(201);
    expect(res.body.autor.nome).toBe("Jorge Amado");
  });

  it("deve listar livros publicamente com paginação", async () => {
    const res = await request(app).get("/livros?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("page");
  });

  it("deve rejeitar ISBN duplicado", async () => {
    const dados = {
      titulo: "Gabriela",
      isbn: "9788535910681",
      autorId,
    };

    await request(app)
      .post("/livros")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(dados);

    const res = await request(app)
      .post("/livros")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(dados);

    expect(res.status).toBe(400);
  });

  it("USER comum não pode criar livro (403)", async () => {
    const userToken = await criarUser();

    const res = await request(app)
      .post("/livros")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ titulo: "Teste", isbn: "9781234567890", autorId });

    expect(res.status).toBe(403);
  });
});

describe("Users — atualização de dados", () => {
  it("usuário pode atualizar seus próprios dados", async () => {
    const token = await criarUser();

    const userRes = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .patch(`/users/${userRes.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Usuario Atualizado" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Usuario Atualizado");
  });

  it("ADMIN pode atualizar qualquer usuário", async () => {
    const { token: adminToken } = await criarAdmin();
    await criarUser();

    const user = await prisma.user.findUnique({ where: { email: "user@email.com" } });

    const res = await request(app)
      .patch(`/users/${user?.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Usuario Alterado pelo Admin" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Usuario Alterado pelo Admin");
  });

  it("usuário não pode atualizar outro usuário", async () => {
    await request(app).post("/auth/register").send({
      name: "User A",
      email: "usera@email.com",
      password: "senha123",
    });

    const loginB = await request(app).post("/auth/register").send({
      name: "User B",
      email: "userb@email.com",
      password: "senha123",
    });

    const loginResB = await request(app).post("/auth/login").send({
      email: "userb@email.com",
      password: "senha123",
    });

    const userA = await prisma.user.findUnique({ where: { email: "usera@email.com" } });

    const res = await request(app)
      .patch(`/users/${userA?.id}`)
      .set("Authorization", `Bearer ${loginResB.body.token}`)
      .send({ name: "Tentativa Indevida" });

    expect(res.status).toBe(403);
  });
});

describe("Empréstimos — controle de propriedade", () => {
  let adminToken: string;
  let user1Token: string;
  let user2Token: string;
  let livroId: number;

  beforeEach(async () => {
    const admin = await criarAdmin();
    adminToken = admin.token;

    // Cria usuário 1
    await request(app).post("/auth/register").send({
      name: "User 1",
      email: "user1@email.com",
      password: "senha123",
    });
    const u1 = await request(app).post("/auth/login").send({
      email: "user1@email.com",
      password: "senha123",
    });
    user1Token = u1.body.token;

    // Cria usuário 2
    await request(app).post("/auth/register").send({
      name: "User 2",
      email: "user2@email.com",
      password: "senha123",
    });
    const u2 = await request(app).post("/auth/login").send({
      email: "user2@email.com",
      password: "senha123",
    });
    user2Token = u2.body.token;

    // Cria autor e livro
    const autorRes = await request(app)
      .post("/autores")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ nome: "Autor Teste" });

    const livroRes = await request(app)
      .post("/livros")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        titulo: "Livro para Empréstimo",
        isbn: "9781111111111",
        autorId: autorRes.body.id,
      });

    livroId = livroRes.body.id;
  });

  it("usuário autenticado pode realizar empréstimo", async () => {
    const res = await request(app)
      .post("/emprestimos")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ livroId });

    expect(res.status).toBe(201);
    expect(res.body.livro.id).toBe(livroId);
  });

  it("user2 não pode devolver empréstimo do user1 (403)", async () => {
    const empRes = await request(app)
      .post("/emprestimos")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ livroId });

    const res = await request(app)
      .patch(`/emprestimos/${empRes.body.id}/devolver`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
  });

  it("user1 pode devolver seu próprio empréstimo", async () => {
    const empRes = await request(app)
      .post("/emprestimos")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ livroId });

    const res = await request(app)
      .patch(`/emprestimos/${empRes.body.id}/devolver`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.devolvido).toBe(true);
  });

  it("ADMIN pode fazer soft delete de empréstimo", async () => {
    const empRes = await request(app)
      .post("/emprestimos")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ livroId });

    const res = await request(app)
      .delete(`/emprestimos/${empRes.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it("user sem token recebe 401 ao tentar emprestar", async () => {
    const res = await request(app)
      .post("/emprestimos")
      .send({ livroId });

    expect(res.status).toBe(401);
  });
});
