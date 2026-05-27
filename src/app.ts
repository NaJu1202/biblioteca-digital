import express from "express";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { autoresRouter } from "./routes/autores.js";
import { livrosRouter } from "./routes/livros.js";
import { emprestimosRouter } from "./routes/emprestimos.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  // Health check
  app.get("/", (_req, res) => {
    res.json({ message: "Biblioteca Digital API 📚", status: "ok" });
  });

  // Rotas
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/autores", autoresRouter);
  app.use("/livros", livrosRouter);
  app.use("/emprestimos", emprestimosRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "Rota não encontrada." });
  });

  return app;
}
