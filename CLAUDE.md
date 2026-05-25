# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server on localhost:3000
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # type-check without emitting
```

No test suite is configured.

## Architecture

**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL) · Supabase Auth · ZAPI (WhatsApp)

---

### Environment variables

Defined in `.env.local` (use `.env.example` as reference):

| Variable | Side | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key (browser auth client) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | Service role key — bypasses RLS; used in all API routes |
| `ADMIN_PASSWORD` | server-only | Password for the book-deletion confirmation modal only |
| `ZAPI_API` | server-only | Full ZAPI endpoint URL for WhatsApp messages |
| `ZAPI_CLIENT_TOKEN` | server-only | ZAPI `Client-Token` request header value |

---

### Authentication

Auth is handled by **Supabase Auth** (email + password). No custom session logic.

- **`src/lib/supabase-browser.ts`** — `createSupabaseBrowserClient()` using the anon key; used in client components for login, signup, logout, and profile updates.
- **`src/lib/supabase-server.ts`** — `getSessionUser()` reads the session from request cookies; used in API routes that need the authenticated user's identity.
- **`src/proxy.ts`** — Next.js 16 proxy (replaces middleware); refreshes the session on every request, sets cookie `maxAge` to 5 days, and redirects unauthenticated users to `/login`. Matcher excludes `/api/*`.
- **`src/app/api/auth/callback/route.ts`** — exchanges the email-confirmation code for a session (needed if Supabase email confirmation is enabled).

User metadata stored on signup (via `options.data`):
- `full_name` — user's full name
- `telefone` — digits-only phone number (`phone` is a reserved Supabase Auth field and will be ignored)

---

### Database

**`src/lib/db.ts`** exports the Supabase service-role client (`supabase`) and all types. RLS is bypassed — access control is enforced in each API route.

#### Schema

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

- `books.status` is `'disponível'` or `'indisponível'`
- `retiradas.user_id` links each withdrawal to the Supabase Auth user
- State-changing operations update `books.status` first, then insert; on insert failure the status is manually rolled back

---

### Lib files

| File | Purpose |
|---|---|
| `src/lib/db.ts` | Supabase service-role client + `Book`, `Retirada`, `Devolucao` types |
| `src/lib/supabase-browser.ts` | Browser Supabase client (anon key) |
| `src/lib/supabase-server.ts` | `getSessionUser()` — reads session from cookies in API routes |
| `src/lib/zapi.ts` | `sendWhatsApp(phone, message)` — fire-and-forget WhatsApp notification via ZAPI |

---

### API routes

All routes are under `src/app/api/` and use Route Handlers (no Express layer).

| Route | Methods | Auth required | Purpose |
|---|---|---|---|
| `/api/books` | GET, POST | No | List / create books |
| `/api/books/[id]` | PATCH, DELETE | No | Edit / delete a book |
| `/api/retiradas` | GET, POST | POST: yes | List all / register a withdrawal |
| `/api/retiradas/minhas` | GET | Yes | Books currently withdrawn by the logged-in user |
| `/api/devolucoes` | GET, POST | POST: yes | List all / register a return |
| `/api/auth` | POST | No | Validates `ADMIN_PASSWORD` for the deletion modal |
| `/api/auth/callback` | GET | No | Supabase email-confirmation code exchange |

**POST `/api/retiradas`** reads `full_name` and `telefone` from `user.user_metadata`, stores them in `retiradas`, sets the book to `indisponível`, and fires a WhatsApp notification via `sendWhatsApp` (non-blocking).

**POST `/api/devolucoes`** verifies the most recent `retiradas` row for the book belongs to the requesting user (`user_id` match) before allowing the return.

---

### Pages & components

`src/app/layout.tsx` renders `<Header>` globally.

#### Pages

| Route | Access | What it shows |
|---|---|---|
| `/login` | Public | Email + password login form |
| `/cadastro` | Public | Registration form (name, phone, email, password) — auto-login on success |
| `/` | Auth | Stat cards + searchable book table + withdraw/return modals |
| `/perfil` | Auth | Edit own name and phone (Supabase Auth user metadata) |
| `/cadastrar?id=X` | Auth | Create (no `id`) or edit (with `id`) a book |
| `/retiradas` | Auth | Full withdrawal history table |
| `/devolucoes` | Auth | Full return history table |
| `/excluir` | Auth | Delete a book (requires `ADMIN_PASSWORD` confirmation) |

#### Key components

- **`Header`** — shows "Acervo", "Meu perfil", and "Sair" nav when authenticated; hides nav on `/login` and `/cadastro`.
- **`BookTable`** — renders the catalogue; accepts optional `onWithdraw` prop which adds a "Retirar" button for `disponível` books. The home page filters this list client-side via a real-time search input.
- **`WithdrawModal`** — confirmation dialog (no input fields); POSTs `{ book_id }` to `/api/retiradas`; user identity comes from the session.
- **`ReturnModal`** — select from books the current user has withdrawn (`/api/retiradas/minhas`); POSTs to `/api/devolucoes`.
- **`DeleteModal`** — asks for `ADMIN_PASSWORD` before calling DELETE `/api/books/[id]`.
- **`BookForm`** — shared create/edit form used by `/cadastrar`.

---

### ZAPI integration

`src/lib/zapi.ts` sends WhatsApp messages via ZAPI. Called after a successful withdrawal with a personalised message. Errors are logged to the server console but never propagate to the client.

Phone number is automatically prefixed with `55` (Brazil country code) if not already present.
