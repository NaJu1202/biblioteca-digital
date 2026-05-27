import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { autorSchema, autorUpdateSchema } from "../schemas/index.js";

export const autoresRouter = Router();

// GET /autores — público
autoresRouter.get("/", async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    const where = search
      ? { nome: { contains: search } }
      : {};

    const [autores, total] = await Promise.all([
      prisma.autor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: "asc" },
        include: { livros: { select: { id: true, titulo: true } } },
      }),
      prisma.autor.count({ where }),
    ]);

    res.json({ data: autores, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: "Erro interno ao buscar autores." });
  }
});

// GET /autores/:id — público
autoresRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const autor = await prisma.autor.findUnique({
      where: { id },
      include: { livros: true },
    });

    if (!autor) {
      res.status(404).json({ error: "Autor não encontrado." });
      return;
    }

    res.json(autor);
  } catch (error) {
    res.status(500).json({ error: "Erro interno ao buscar autor." });
  }
});

// POST /autores — ADMIN apenas
autoresRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const result = autorSchema.safeParse(req.body);
      if (!result.success) {
        res.status(422).json({ error: result.error.flatten() });
        return;
      }

      const autor = await prisma.autor.create({ data: result.data });
      res.status(201).json(autor);
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao criar autor." });
    }
  }
);

// PUT /autores/:id — ADMIN apenas
autoresRouter.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = autorUpdateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(422).json({ error: result.error.flatten() });
        return;
      }

      const existente = await prisma.autor.findUnique({ where: { id } });
      if (!existente) {
        res.status(404).json({ error: "Autor não encontrado." });
        return;
      }

      const autor = await prisma.autor.update({
        where: { id },
        data: result.data,
      });

      res.json(autor);
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao atualizar autor." });
    }
  }
);

// DELETE /autores/:id — ADMIN apenas
autoresRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existente = await prisma.autor.findUnique({ where: { id } });

      if (!existente) {
        res.status(404).json({ error: "Autor não encontrado." });
        return;
      }

      await prisma.autor.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao deletar autor." });
    }
  }
);
