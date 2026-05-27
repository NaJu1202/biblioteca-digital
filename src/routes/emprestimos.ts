import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { emprestimoSchema } from "../schemas/index.js";

export const emprestimosRouter = Router();

// GET /emprestimos — ADMIN vê todos; USER vê apenas os seus
emprestimosRouter.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const isAdmin = req.user!.role === "ADMIN";
    const where = isAdmin ? { deletedAt: null } : { userId: req.user!.sub, deletedAt: null };

    const emprestimos = await prisma.emprestimo.findMany({
      where,
      include: {
        livro: { select: { id: true, titulo: true, isbn: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(emprestimos);
  } catch (error) {
    res.status(500).json({ error: "Erro interno ao buscar empréstimos." });
  }
});

// GET /emprestimos/:id — autenticado (owner ou ADMIN)
emprestimosRouter.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const emprestimo = await prisma.emprestimo.findFirst({
      where: { id, deletedAt: null },
      include: {
        livro: { include: { autor: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!emprestimo) {
      res.status(404).json({ error: "Empréstimo não encontrado." });
      return;
    }

    const isOwner = emprestimo.userId === req.user!.sub;
    const isAdmin = req.user!.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "Acesso negado." });
      return;
    }

    res.json(emprestimo);
  } catch (error) {
    res.status(500).json({ error: "Erro interno ao buscar o empréstimo." });
  }
});

// POST /emprestimos — usuário autenticado realiza um empréstimo
emprestimosRouter.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const result = emprestimoSchema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({ error: result.error.flatten() });
      return;
    }

    const { livroId } = result.data;
    const userId = req.user!.sub;

    const livro = await prisma.livro.findUnique({ where: { id: livroId } });
    if (!livro) {
      res.status(404).json({ error: "Livro não encontrado." });
      return;
    }

    if (!livro.disponivel) {
      res.status(400).json({ error: "Livro não disponível para empréstimo." });
      return;
    }

    const [emprestimo] = await prisma.$transaction([
      prisma.emprestimo.create({
        data: { userId, livroId },
        include: {
          livro: { select: { id: true, titulo: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.livro.update({ where: { id: livroId }, data: { disponivel: false } }),
    ]);

    res.status(201).json(emprestimo);
  } catch (error) {
    res.status(500).json({ error: "Erro interno ao criar empréstimo." });
  }
});

// PATCH /emprestimos/:id/devolver — controle de propriedade: só o dono pode devolver
emprestimosRouter.patch(
  "/:id/devolver",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const emprestimo = await prisma.emprestimo.findFirst({
        where: { id, deletedAt: null },
      });

      if (!emprestimo) {
        res.status(404).json({ error: "Empréstimo não encontrado." });
        return;
      }

      const isOwner = emprestimo.userId === req.user!.sub;
      const isAdmin = req.user!.role === "ADMIN";
      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: "Apenas o dono pode devolver este livro." });
        return;
      }

      if (emprestimo.devolvido) {
        res.status(400).json({ error: "Livro já foi devolvido." });
        return;
      }

      const [atualizado] = await prisma.$transaction([
        prisma.emprestimo.update({
          where: { id },
          data: { devolvido: true, dataDevolucao: new Date() },
          include: {
            livro: { select: { id: true, titulo: true } },
            user: { select: { id: true, name: true } },
          },
        }),
        prisma.livro.update({
          where: { id: emprestimo.livroId },
          data: { disponivel: true },
        }),
      ]);

      res.json(atualizado);
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao devolver empréstimo." });
    }
  }
);

// DELETE /emprestimos/:id — soft delete, apenas ADMIN
emprestimosRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const emprestimo = await prisma.emprestimo.findFirst({
        where: { id, deletedAt: null },
      });

      if (!emprestimo) {
        res.status(404).json({ error: "Empréstimo não encontrado." });
        return;
      }

      await prisma.emprestimo.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao deletar empréstimo." });
    }
  }
);
