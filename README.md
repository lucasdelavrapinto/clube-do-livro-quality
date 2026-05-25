# Clube do Livro

Aplicação web para gestão do acervo e empréstimos de um clube do livro.  
Membros fazem login, retiram e devolvem livros, e recebem notificações via WhatsApp.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase (Auth + PostgreSQL) · ZAPI (WhatsApp)

---

## Funcionalidades

- Catálogo de livros com pesquisa em tempo real por título
- Retirada e devolução de livros vinculadas ao usuário autenticado
- Notificação automática via WhatsApp ao retirar um livro
- Autenticação por email e senha (Supabase Auth) com sessão de 5 dias
- Cadastro com nome completo e telefone (validação de número brasileiro)
- Edição de perfil (nome e telefone)
- Histórico completo de retiradas e devoluções
- Cadastro, edição e exclusão de livros (com confirmação por senha)

---

## Desenvolvimento local

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # build de produção
npm run lint      # ESLint
npx tsc --noEmit  # type-check
```

---

## Variáveis de ambiente

Crie `.env.local` na raiz (use `.env.example` como referência):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key        # "anon public" no dashboard
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key    # "service_role" — nunca exponha

# Senha de confirmação para exclusão de livros
ADMIN_PASSWORD=troque-aqui

# ZAPI — notificações WhatsApp (https://z-api.io)
ZAPI_API=https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-text
ZAPI_CLIENT_TOKEN=seu_client_token
```

---

## Configuração do Supabase

### 1. Criar as tabelas

Execute no **SQL Editor** do Supabase:

```sql
CREATE TABLE books (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name      TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'disponível',
  owner     TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE retiradas (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_id     BIGINT NOT NULL REFERENCES books(id),
  user_id     UUID REFERENCES auth.users(id),
  pessoa      TEXT NOT NULL,
  telefone    TEXT NOT NULL DEFAULT '',
  retirado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE devolucoes (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_id      BIGINT NOT NULL REFERENCES books(id),
  devolvido_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. Configurar autenticação

Em **Authentication → Providers → Email**:
- Desmarque **"Confirm email"** para login automático após cadastro

Em **Authentication → URL Configuration**, adicione o redirect URL:
```
http://localhost:3000/api/auth/callback
```
Adicione também o domínio de produção ao fazer deploy.

---

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/login` | Público | Login com email e senha |
| `/cadastro` | Público | Criar conta (nome, telefone, email, senha) |
| `/` | Autenticado | Acervo com busca, retirada e devolução |
| `/perfil` | Autenticado | Editar nome e telefone |
| `/cadastrar` | Autenticado | Cadastrar novo livro ou editar existente (`?id=X`) |
| `/retiradas` | Autenticado | Histórico de retiradas |
| `/devolucoes` | Autenticado | Histórico de devoluções |
| `/excluir` | Autenticado | Excluir livro (requer senha de confirmação) |

---

## Regras de negócio

- Apenas o usuário que retirou um livro pode devolvê-lo
- Ao retirar um livro, o membro recebe uma mensagem WhatsApp de confirmação
- O telefone cadastrado deve ser um número brasileiro válido (DDD + número)
- A exclusão de livros requer a senha `ADMIN_PASSWORD` como confirmação adicional

---

## Deploy

A aplicação é compatível com qualquer plataforma que suporte Next.js (Vercel, Railway, etc.).

Configure as variáveis de ambiente da seção acima na plataforma escolhida e adicione a URL de produção em **Supabase → Authentication → URL Configuration**.
