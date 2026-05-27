import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Senha obrigatória."),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").optional(),
  email: z.string().email("E-mail inválido.").optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Ao menos um campo deve ser informado.",
});

// ─── Autor ────────────────────────────────────────────────────────────────────

export const autorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  biografia: z.string().optional(),
});

export const autorUpdateSchema = autorSchema.partial();

// ─── Livro ────────────────────────────────────────────────────────────────────

export const livroSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório."),
  isbn: z.string().min(10, "ISBN deve ter ao menos 10 caracteres."),
  anoPublicacao: z.number().int().optional(),
  autorId: z.number().int().positive("ID do autor inválido."),
});

export const livroUpdateSchema = livroSchema.partial();

// ─── Empréstimo ───────────────────────────────────────────────────────────────

export const emprestimoSchema = z.object({
  livroId: z.number().int().positive("ID do livro inválido."),
});

export const devolucaoSchema = z.object({
  devolvido: z.literal(true),
});
