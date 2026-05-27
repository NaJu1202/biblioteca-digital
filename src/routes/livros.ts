import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { livroSchema, livroUpdateSchema } from "../schemas/index.js";

export const livrosRouter = Router();

// GET /livros — público (com paginação e busca)
livrosRouter.get("/", async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;
    
    const where = search
      ? { titulo: { contains: search } }
      : {};

    const [livros, total] = await Promise.all([
      prisma.livro.findMany({
        where,
        skip,
        take: limit,
        orderBy: { titulo: "asc" },
        include: { autor: { select: { id: true, nome: true } } },
      }),
      prisma.livro.count({ where }),
    ]);

    if (!livros) {
      res.status(404).json({ error: "Livros não encontrados." });
      return;
    }
    
    res.json({ data: livros, total, page, limit });
  
  } catch (error) {
    res.status(500).json({ error: "Erro interno ao tentar buscar." });
  }
});

// GET /livros/:id — público
livrosRouter.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const livro = await prisma.livro.findUnique({
    where: { id },
    include: { autor: true },
  });

  if (!livro) {
    res.status(404).json({ error: "Livro não encontrado." });
    return;
  }

  res.json(livro);
});

// POST /livros — ADMIN apenas
livrosRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const result = livroSchema.safeParse(req.body);
      if (!result.success) {
        res.status(422).json({ error: result.error.flatten() });
        return;
      }

      const autorExiste = await prisma.autor.findUnique({
        where: { id: result.data.autorId },
      });
      if (!autorExiste) {
        res.status(400).json({ error: "Autor não encontrado." });
        return;
      }

      const isbnExiste = await prisma.livro.findUnique({
        where: { isbn: result.data.isbn },
      });
      if (isbnExiste) {
        res.status(400).json({ error: "ISBN já cadastrado." });
        return;
      }

      const livro = await prisma.livro.create({
        data: result.data,
        include: { autor: { select: { id: true, nome: true } } },
      });

      res.status(201).json(livro);
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao tentar criar." });
    }
  }
);

// PUT /livros/:id — ADMIN apenas
livrosRouter.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = livroUpdateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(422).json({ error: result.error.flatten() });
        return;
      }

      const existente = await prisma.livro.findUnique({ where: { id } });
      if (!existente) {
        res.status(404).json({ error: "Livro não encontrado." });
        return;
      }

      const livro = await prisma.livro.update({
        where: { id },
        data: result.data,
        include: { autor: { select: { id: true, nome: true } } },
      });

      res.json(livro);
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao tentar atualizar." });
    }
  }
);

// DELETE /livros/:id — ADMIN apenas
livrosRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existente = await prisma.livro.findUnique({ where: { id } });

      if (!existente) {
        res.status(404).json({ error: "Livro não encontrado." });
        return;
      }

      await prisma.livro.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao tentar deletar." });
    }
  }
);
