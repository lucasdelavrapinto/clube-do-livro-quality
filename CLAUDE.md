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

**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4

The catalogue is **read-only and public**. Accounts (login/registration) are wired to the
Laravel API's Sanctum endpoints. The withdrawal ("retirada") action is the one piece still
without a backend — see *Authentication* below.

---

### Data source

The catalogue is owned by a separate Laravel app (`Sistema-Quality`, a sibling repo at
`../Sistema-Quality`). This project only reads from it.

`GET /api/livros` on the Laravel side is public and accepts optional `search`,
`categoria`, `per_page` and `page`. It responds:

```jsonc
{
  "data": [
    {
      "id": 4,
      "titulo": "Pai Rico Pai Pobre",
      "escritor": "Robert Kiyosaki",
      "categoria": "Finanças",       // nullable
      "disponibilizado_por": "Lucas Pinto",
      "resumo": "...",               // nullable
      "imagem_url": "http://.../storage/livros/....jpg",  // nullable
      "cadastrado_por": "Lucas Pinto",
      "created_at": "2026-08-20T14:46:06.000000Z"
    }
  ],
  "meta": { "total": 2 },
  "error": null
}
```

There is **no status field** — the upstream API has no concept of a book being
withdrawn, so every book it returns is presented as available.

---

### Environment variables

Defined in `.env.local` (see `.env.example`):

| Variable | Side | Purpose |
|---|---|---|
| `LIVROS_API_URL` | server-only | Full URL of the Laravel catalogue endpoint. Defaults to `http://127.0.0.1:8001/api/livros` |
| `API_V1_URL` | server-only | Base of the Laravel v1 routes (auth + retirada). Defaults to `http://127.0.0.1:8001/api/v1` |

> **The `127.0.0.1:8001` default only works if something is actually listening there.**
> In production, `Sistema-Quality` (`/var/www/sistema`) is a Laravel app served by the
> *same* Apache via `mod_php` — it has no port of its own, only its `ServerName` vhost
> (`sistema.qualitytransportes.com.br`). There, `.env` must set both vars to
> `https://sistema.qualitytransportes.com.br/api/livros` and `.../api/v1`. The `8001`
> default is only meaningful for a local `php artisan serve --port=8001` next to this repo.

> Deploying requires setting `LIVROS_API_URL` on the host. Without it the app falls
> back to `127.0.0.1:8001`, which does not exist in production.

---

### Files

| File | Purpose |
|---|---|
| `src/app/layout.tsx` | Root layout; renders `<Header>` globally |
| `src/app/page.tsx` | The only page — the acervo. Client component: fetches `/api/livros`, filters, opens the detail modal |
| `src/app/api/livros/route.ts` | Server-side proxy to the Laravel API |
| `src/lib/livros.ts` | `Livro`/`LivrosResponse` types + `normalizar()` |
| `src/components/AcervoGrid.tsx` | Cover-card grid; also exports `Capa` |
| `src/components/CategoriaFiltro.tsx` | Category chip row above the grid; also exports `SEM_CATEGORIA` |
| `src/components/LivroModal.tsx` | Book detail dialog |
| `src/components/Header.tsx` | Auth-aware header: greets the signed-in user + "Sair", or "Login / Cadastrar" |
| `src/lib/auth.ts` | Auth types, error-envelope parsing, and the still-stubbed `retirarLivro()` |
| `src/lib/auth-server.ts` | Server-side auth proxy: talks to Laravel, manages the httpOnly cookie |
| `src/components/SessaoProvider.tsx` | Session context — `useSessao()` / `useUsuario()`. Mounted in the root layout |
| `src/lib/telefone.ts` | Brazilian phone mask + DDD/mobile validation |
| `src/app/login/page.tsx` | Email + password form. Honours `?next=` (internal paths only) |
| `src/app/cadastro/page.tsx` | Registration form (nome, telefone, email, senha) |
| `src/app/esqueci-senha/page.tsx` | "Esqueci minha senha": asks for the email, always shows the same confirmation |
| `src/app/redefinir-senha/page.tsx` | Target of the reset email's link (`?token=&email=`): new password, then signs in |

#### Why the proxy route exists

`src/app/api/livros/route.ts` is a thin passthrough, but it earns its place: the browser
never talks to the Laravel host directly, which avoids CORS and mixed-content problems,
and keeps `LIVROS_API_URL` (which differs per environment) out of the client bundle. It
forwards `search`/`categoria`/`per_page`/`page`, caches the upstream response for 60s,
and converts any upstream failure into `{ data: [], meta: { total: 0 }, error: "..." }`
with status 502, so the page always has a shape it can render.

#### Search and category filter

Filtering happens client-side over the already-loaded list, across título, escritor,
categoria and disponibilizado_por. `normalizar()` strips diacritics so `financas`
matches `Finanças`. The proxy also forwards `?search=` upstream, which is unused by
the UI today but available if the catalogue grows enough to need server-side paging.

`CategoriaFiltro` renders a chip per category directly above the grid — there is no
category endpoint, so the list is derived from the loaded books (with a count each,
alphabetical by `pt-BR`). Books whose `categoria` is null group under a trailing
"Sem categoria" chip, keyed by the `SEM_CATEGORIA` sentinel so they stay reachable.
The chip filter and the search box narrow the list together (AND). The row hides
itself when there are fewer than two categories, and it wraps onto several lines from
`sm` up — with ~11 categories the horizontal scroll it uses on mobile would hide half
of them on a wide screen.

The "20 de 21 livros disponíveis" line in the header deliberately keeps counting the
whole acervo, not the filtered slice: it describes the club, not the current view.

#### Covers

`imagem_url` is rendered with a plain `<img>`, not `next/image`, because the image host
comes from the API and changes per environment. `Capa` falls back to the title's first
letter when the URL is missing or the image fails to load.

---

### Authentication

Login and registration are **live** against `Sistema-Quality`'s Sanctum endpoints. The
browser never sees the token: four Next route handlers proxy to Laravel and keep the
token in an `httpOnly` cookie named `clube_token`.

| Next route | Proxies to | Notes |
|---|---|---|
| `POST /api/auth/register` | `POST /api/v1/auth/register` | Server assigns the `LIVROS` role |
| `POST /api/auth/login` | `POST /api/v1/auth/login` | Accepts `MOTORISTA` or `LIVROS` |
| `GET /api/auth/me` | `GET /api/v1/auth/me` | Returns `data: null` when signed out |
| `POST /api/auth/logout` | `POST /api/v1/auth/logout` | Revokes the token, clears the cookie |
| `POST /api/auth/forgot-password` | `POST /api/v1/auth/forgot-password` | Always 200 — never reveals whether the email exists |
| `POST /api/auth/reset-password` | `POST /api/v1/auth/reset-password` | Does not sign in; 422 on `token` when the link is bad |
| `POST /api/retiradas` | `POST /api/v1/livros/{id}/retirada` | Body `{ livro_id }`; 409 `LIVRO_INDISPONIVEL` |
| `POST /api/devolucoes` | `POST /api/v1/livros/{id}/devolucao` | Body `{ livro_id }`; 409 `RETIRADA_NAO_ENCONTRADA` |
| `GET /api/minhas-retiradas` | `GET /api/v1/minhas-retiradas` | Empty list when signed out — no upstream call |

`SessaoProvider` reads `/api/auth/me` once for the whole app; components call
`useUsuario()` or `useSessao()`. Validation errors from Laravel pass through untouched,
so `error.fields` is available to highlight the offending input.

**Field names on the wire are Laravel's** (`name`, `email`, `phone`, `password`,
`password_confirmation`), while the forms use Portuguese state (`nome`, `telefone`,
`senha`). The mapping happens in `SessaoProvider`.

Two constraints worth remembering:

- **Passwords must be at least 8 characters.** The server uses `Rules\Password::defaults()`,
  which is Laravel's `min(8)`. The cadastro and redefinir-senha forms validate the same number — keep them in
  sync if the server rule changes.
- **Phone is sent as typed.** The server strips non-digits before validating, so the mask
  `(11) 91234-5678` is accepted; the column is `string('phone', 11)`.

#### Password reset

"Esqueci minha senha" on the login page leads to `/esqueci-senha`, which posts the email
to `forgot-password`. Laravel answers the same 200 whether or not the account exists, so the
confirmation screen is worded the same way — don't make it say "email sent". It only sends
the link to users who could log in through the API (active, role `MOTORISTA` or `LIVROS`).

The email is built by `Sistema-Quality` (`RedefinicaoSenhaClubeMail`) and links to
**this** app: `{CLUBE_LIVRO_URL}/redefinir-senha?token=...&email=...`. `CLUBE_LIVRO_URL`
is a Sistema-Quality env var defaulting to `https://clubedolivro.qualitytransportes.com.br`;
locally it must be `http://localhost:3000` in Sistema-Quality's `.env`. **Renaming the
`/redefinir-senha` route breaks every link already in someone's inbox** — change the
Mailable in the same deploy. The link lasts 60 minutes (`auth.passwords.users.expire`)
and is single-use.

`reset-password` only changes the password — and revokes every Sanctum token the user
had. The page then calls `entrar()` with the new password so the person lands signed in;
if that login is refused (e.g. an account without an API role that used a link from the
portal's own reset), it falls back to a "Senha redefinida — Entrar" screen. The reset
itself already happened either way.

#### Withdrawals

`POST /api/retiradas` takes `{ livro_id }`, validates it is a positive integer (it is
interpolated into the upstream URL), attaches the Bearer token from the cookie, and calls
`POST /api/v1/livros/{id}/retirada` with an empty body. Upstream statuses pass through —
notably **409 `LIVRO_INDISPONIVEL`** when someone else got there first. Laravel wraps the
whole thing in a transaction with `lockForUpdate()`, so concurrent retiradas are safe.

**One book per person.** `LivroController::LIMITE_POR_PESSOA` (currently `1`) caps how many
open retiradas a user may have. The check runs inside the transaction *after* locking the
user's own row:

```php
User::whereKey($request->user()->id)->lockForUpdate()->first();
$emMaos = LivroRetirada::where('user_id', ...)->emAberto()->count();
```

That lock is the whole point. Two simultaneous requests for *different* books lock
*different* `livros` rows, so without serialising on the user they would both pass the
count and the person would end up holding two. Exceeding the limit returns 409
`LIMITE_ATINGIDO`. The limit is checked before availability, so "you already have a book"
wins over "this one is taken" — it is the more actionable message.

`src/app/page.tsx` mirrors the number in `LIMITE_POR_PESSOA`; the modal greys out "Retirar"
and explains why. **Keep the two constants in sync** — the client copy is only there to
avoid a pointless round-trip, the server is what enforces it.

`GET /api/livros` now returns a `disponivel` boolean per book, which drives three things:
the "Retirado" badge on the card, the disabled "Indisponível" button in the modal, and the
"2 de 3 livros disponíveis" count in the section header.

> **The catalogue proxy must not cache.** `src/app/api/livros/route.ts` uses
> `cache: 'no-store'` on purpose. It used to hold `next: { revalidate: 60 }`, which would
> now show a just-retired book as available for up to a minute. Upstream caches with a
> version key (`Livro::versaoCache()`) that a retirada bumps, so freshness is handled
> there — a second layer here only adds staleness.

#### Returns

Implemented. `LivroController::devolucao` (added by us in the `Sistema-Quality` repo)
enforces ownership **in the query, not in a follow-up `if`**:

```php
$aberta = LivroRetirada::where('livro_id', $exemplar->id)
    ->where('user_id', $request->user()->id)
    ->emAberto()
    ->latest('retirado_em')
    ->first();
```

No open row for *this* user means the return does not happen — whether the book is free or
held by somebody else. Both cases return the same `RETIRADA_NAO_ENCONTRADA`, deliberately,
so the endpoint cannot be used to discover who holds a book. The whole thing runs inside
`DB::transaction` with `lockForUpdate()`, mirroring `retirada()`.

`GET /api/v1/minhas-retiradas` lists what the signed-in user currently holds. The app needs
it because `GET /api/livros` is public and never says who holds a book — without it the UI
knows a book is unavailable but not whether *you* are the one holding it.

Those two feed one contextual button in `LivroModal`:

| State | Button |
|---|---|
| `disponivel` | **Retirar** (blue) |
| held by you | **Devolver** (amber) |
| held by someone else | Indisponível, disabled |

The card in `AcervoGrid` matches: an amber "Com você" strip when it is yours, a grey
"Retirado" one otherwise.

> **Not handled: forced returns.** If a member leaves the club or loses a book, the copy is
> stuck — only the holder can return it. An admin route or an artisan command would fix it.

---

### Deployment

Served at `clubedolivro.qualitytransportes.com.br`, following the same pattern as the
sibling `assinatura-documentos` app — the only other Next.js app on this host running as
a standalone Node process behind Apache (the rest are static SPAs or Laravel/mod_php).

- `next.config.ts` sets `output: "standalone"`, so `npm run build` produces
  `.next/standalone/server.js`. After building, `public/` and `.next/static` must be
  copied into `.next/standalone/` by hand (standalone mode doesn't include them) — see
  `assinatura-documentos`'s deploy notes for the same step.
- `/etc/systemd/system/clube-do-livro.service` runs `node server.js` from
  `.next/standalone` as `www-data`, with `PORT=3002` (3001 is `assinatura-documentos`;
  check `grep PORT /etc/systemd/system/*.service` before picking a port for a new app).
  `Restart=always`, enabled on boot.
- `.env` must be copied into `.next/standalone/.env` too — the standalone server reads
  its environment from its own working directory, not the repo root — and the service
  restarted after any change.
- `/etc/apache2/sites-available/clube-do-livro.conf` (+ `-le-ssl.conf`, generated by
  certbot) reverse-proxies `/` to `127.0.0.1:3002` and serves `/_next/static` directly
  from disk for caching, mirroring `assinatura-documentos.conf`.
- TLS via `certbot --apache -d clubedolivro.qualitytransportes.com.br`; renews
  automatically.

---

### History

This app previously had Supabase (auth + a `books`/`retiradas`/`devolucoes`/`sugestoes`
schema) and ZAPI WhatsApp notifications, covering withdrawals, returns, suggestions and
a login flow. The Supabase project was deleted upstream — its host stopped resolving in
DNS — so all of it was removed on 2026-08-20. The code is still in git history at commit
`c820377` if any of it needs to come back.

Re-adding withdrawals means either the Laravel API growing those endpoints, or a new
persistence layer here. Note the old ids do not carry over: `retiradas.book_id` pointed
at Supabase's `books` table, which is unrelated to the catalogue ids the Laravel API
returns.
