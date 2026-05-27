# 📚 Biblioteca Digital — C2

API REST completa para um sistema de Biblioteca Digital, desenvolvida com Node.js + TypeScript, Express, Prisma ORM e SQLite.

## Domínio escolhido

**Biblioteca Digital** — permite que usuários se cadastrem, realizem empréstimos de livros e acompanhem seu histórico, enquanto administradores gerenciam o acervo (autores e livros).

## Entidades

| Entidade     | Descrição                                                 |
|--------------|-----------------------------------------------------------|
| `User`       | Usuários do sistema (role: USER ou ADMIN)                 |
| `Autor`      | Autores dos livros do acervo                              |
| `Livro`      | Livros disponíveis para empréstimo (ISBN único)           |
| `Emprestimo` | Registro de empréstimo entre um User e um Livro (soft delete) |

## Stack

- **Runtime:** Node.js 20+ com TypeScript (ES Modules)
- **Framework:** Express.js
- **ORM:** Prisma com SQLite
- **Auth:** JWT + bcrypt
- **Validação:** Zod
- **Testes:** Vitest + Supertest

## Instalação

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd biblioteca-digital

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Execute as migrations do banco
npx prisma migrate dev --name init

# 5. Inicie o servidor
npm run dev
```

## Variáveis de Ambiente

Veja o arquivo `.env.example` para todas as variáveis necessárias.

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="sua_chave_secreta_aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
```

## Rodando os Testes

```bash
# Rodar todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Relatório de cobertura
npm run test:coverage
```

## Rotas da API

### Auth
| Método | Rota            | Descrição                          | Auth |
|--------|-----------------|------------------------------------|------|
| POST   | /auth/register  | Cadastra novo usuário              | ❌   |
| POST   | /auth/login     | Autentica e retorna JWT            | ❌   |
| GET    | /auth/me        | Retorna dados do usuário logado    | ✅   |

### Autores
| Método | Rota          | Descrição                | Auth  | Role  |
|--------|---------------|--------------------------|-------|-------|
| GET    | /autores      | Lista autores (paginado) | ❌    | -     |
| GET    | /autores/:id  | Busca autor por ID       | ❌    | -     |
| POST   | /autores      | Cria novo autor          | ✅    | ADMIN |
| PUT    | /autores/:id  | Atualiza autor           | ✅    | ADMIN |
| DELETE | /autores/:id  | Remove autor             | ✅    | ADMIN |

### Livros
| Método | Rota         | Descrição                | Auth  | Role  |
|--------|--------------|--------------------------|-------|-------|
| GET    | /livros      | Lista livros (paginado)  | ❌    | -     |
| GET    | /livros/:id  | Busca livro por ID       | ❌    | -     |
| POST   | /livros      | Cria novo livro          | ✅    | ADMIN |
| PUT    | /livros/:id  | Atualiza livro           | ✅    | ADMIN |
| DELETE | /livros/:id  | Remove livro             | ✅    | ADMIN |

### Empréstimos
| Método | Rota                       | Descrição                      | Auth | Role         |
|--------|----------------------------|--------------------------------|------|--------------|
| GET    | /emprestimos               | Lista empréstimos              | ✅   | Próprios/ALL |
| GET    | /emprestimos/:id           | Busca empréstimo por ID        | ✅   | Dono/ADMIN   |
| POST   | /emprestimos               | Realiza empréstimo             | ✅   | USER/ADMIN   |
| PATCH  | /emprestimos/:id/devolver  | Devolve livro (controle dono)  | ✅   | Dono/ADMIN   |
| DELETE | /emprestimos/:id           | Soft delete do empréstimo      | ✅   | ADMIN        |

### Usuários (Admin)
| Método | Rota        | Descrição         | Auth | Role  |
|--------|-------------|-------------------|------|-------|
| GET    | /users      | Lista usuários    | ✅   | ADMIN |
| GET    | /users/:id  | Busca usuário     | ✅   | ADMIN |
| DELETE | /users/:id  | Remove usuário    | ✅   | ADMIN |

## Exemplos de Requisição

### Registrar usuário
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","email":"joao@email.com","password":"senha123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@email.com","password":"senha123"}'
```

### Criar autor (ADMIN)
```bash
curl -X POST http://localhost:3000/autores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"nome":"Machado de Assis","biografia":"Escritor brasileiro."}'
```

### Criar livro (ADMIN)
```bash
curl -X POST http://localhost:3000/livros \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"titulo":"Dom Casmurro","isbn":"9788598078465","anoPublicacao":1899,"autorId":1}'
```

### Realizar empréstimo
```bash
curl -X POST http://localhost:3000/emprestimos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"livroId":1}'
```

### Listar livros com paginação e busca
```bash
curl "http://localhost:3000/livros?page=1&limit=10&search=Dom"
```

## Estrutura do Projeto

```
biblioteca-digital/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── lib/
│   │   ├── prisma.ts        # Cliente Prisma (dev/test)
│   │   └── auth.ts          # hash, verify, signToken, verifyToken
│   ├── middlewares/
│   │   ├── authenticate.ts  # Verifica JWT
│   │   └── authorize.ts     # Verifica roles
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── autores.ts
│   │   ├── livros.ts
│   │   └── emprestimos.ts
│   ├── schemas/             # Validações Zod
│   │   └── index.ts
│   ├── app.ts               # createApp() — fábrica para testes
│   └── server.ts            # Bootstrap do servidor
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts     # Testes de hash e JWT
│   │   └── schemas.test.ts  # Testes de validação Zod
│   ├── integration/
│   │   ├── auth.test.ts     # Registro, login, /me
│   │   └── recursos.test.ts # CRUD + RBAC + ownership
│   └── setup.ts             # Setup do banco de testes
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Regras de Autorização

- **Rotas públicas:** GET /autores, GET /livros
- **Autenticadas (USER+ADMIN):** POST /emprestimos, GET /emprestimos, /auth/me
- **Só o dono:** PATCH /emprestimos/:id/devolver
- **Só ADMIN:** POST/PUT/DELETE autores e livros, GET/DELETE users, DELETE emprestimos

## Pontos extras implementados

- ✅ Paginação e filtros (`?page=1&limit=20&search=...`) em /autores e /livros
- ✅ Soft delete com campo `deletedAt` na entidade `Emprestimo`
