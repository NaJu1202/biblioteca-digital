import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { userUpdateSchema } from "../schemas/index.js";

export const usersRouter = Router();

// GET /users — apenas ADMIN
usersRouter.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao tentar buscar." });
    }
  }
);

// GET /users/:id — apenas ADMIN
usersRouter.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });

      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao tentar buscar." });
    }
  }
);

// PATCH /users/:id — apenas owner ou ADMIN
usersRouter.patch(
  "/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (req.user!.sub !== id && req.user!.role !== "ADMIN") {
        res.status(403).json({ error: "Acesso negado." });
        return;
      }

      const result = userUpdateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(422).json({ error: result.error.flatten() });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }
        const updated = await prisma.user.update({
          where: { id },
          data: result.data,
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        });

        res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao tentar atualizar." });
    }
  }
);

// DELETE /users/:id — apenas ADMIN
usersRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }
    try {
      await prisma.user.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao tentar deletar." });
    }
  }
);
