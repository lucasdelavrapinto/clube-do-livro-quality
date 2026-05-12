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

**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · SQLite via `better-sqlite3`

### Database

`src/lib/db.ts` is the single entry point for the database. It exports `getDb()`, which lazily initialises a singleton `better-sqlite3` connection and runs `CREATE TABLE IF NOT EXISTS` for all three tables on first call. The DB file lives at `data/books.db` (relative to `process.cwd()`). All types (`Book`, `Retirada`, `Devolucao`) are also exported from this file.

Tables:
- `books` — the catalogue; `status` is either `'disponível'` or `'indisponível'`
- `retiradas` — one row per withdrawal, records `book_id` + `pessoa` + timestamp
- `devolucoes` — one row per return, records `book_id` + timestamp (no person name)

State-changing operations that touch both `books` and another table (retiradas/devolucoes) are wrapped in a `db.transaction()` to keep the two tables consistent.

### API routes

All routes are under `src/app/api/` and use Route Handlers (no separate Express layer):

| Route | Methods | Purpose |
|---|---|---|
| `/api/books` | GET, POST | list / create books |
| `/api/books/[id]` | PATCH, DELETE | edit / remove a book |
| `/api/retiradas` | GET, POST | list / register a withdrawal (sets book → indisponível) |
| `/api/devolucoes` | GET, POST | list / register a return (sets book → disponível) |

### Pages & components

`src/app/layout.tsx` renders `<Header>` globally. The nav in `Header` only shows the "Acervo" link; `/cadastrar`, `/retiradas`, and `/devolucoes` exist as routes but have no nav buttons (intentional).

| Route | What it shows |
|---|---|
| `/` | stat cards + book table with "Retirar" button + floating "Devolver livro" button |
| `/cadastrar?id=X` | create form (omit `id`) or pre-filled edit form (pass `id`) |
| `/retiradas` | full withdrawal history |
| `/devolucoes` | full return history |

Key components:
- `BookTable` — renders the acervo table; accepts optional `onWithdraw` prop which, when provided, adds a "Retirar" column visible only for `disponível` books.
- `WithdrawModal` — modal triggered by "Retirar"; collects the person's name and POSTs to `/api/retiradas`.
- `ReturnModal` — modal triggered by the floating button; shows a select of `indisponível` books and POSTs to `/api/devolucoes`.
- `BookForm` — shared create/edit form used by `/cadastrar`.
