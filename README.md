# Clube do Livro

Vitrine web do acervo do clube do livro. Mostra os livros disponíveis para retirada,
com capa, autor, categoria e resumo, e busca em tempo real.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4

O app é somente leitura e totalmente público — não tem banco, login nem estado de
usuário. Todo o conteúdo vem da API do `Sistema-Quality`.

---

## Funcionalidades

- Grid de capas do acervo, responsivo (2 a 4 colunas)
- Busca por título, autor, categoria ou quem disponibilizou — ignorando acentos,
  então `financas` encontra `Finanças`
- Modal de detalhe com capa, resumo, categoria e créditos
- Placeholder com a inicial do título quando o livro não tem capa
- Login e cadastro de membros, ligados à API do Sistema-Quality
- Retirada de exemplar: botão no modal, leva ao login se não houver sessão
- Devolução pelo mesmo botão: quem está com o exemplar vê "Devolver"
- Limite de 1 livro por pessoa, garantido no servidor
- Livro com outra pessoa aparece marcado e com o botão desabilitado

---

## Desenvolvimento local

O acervo vem de outro projeto. Suba o Laravel primeiro:

```bash
cd ../Sistema-Quality && php artisan serve --port=8001
```

Depois, aqui:

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
# URL completa do endpoint público de livros do Sistema-Quality
LIVROS_API_URL=http://127.0.0.1:8001/api/livros

# Base das rotas v1 (autenticação e retirada)
API_V1_URL=http://127.0.0.1:8001/api/v1
```

---

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | O acervo: grid de capas, busca e modal de detalhe |
| `/login` | Público | Email e senha |
| `/cadastro` | Público | Criar conta (nome, telefone, email, senha) |
| `/api/livros` | Público | Proxy server-side do acervo |
| `/api/auth/*` | Público | `register`, `login`, `me`, `logout` — proxy da autenticação |
| `/api/retiradas` | Sessão | Registra a retirada de um exemplar |
| `/api/devolucoes` | Sessão | Devolve um exemplar — só quem está com ele |
| `/api/minhas-retiradas` | Sessão | O que está com o usuário agora |

O proxy existe para que o browser não fale direto com o host do Laravel: evita CORS e
mixed content, e mantém a URL da API fora do bundle do cliente. Ele repassa os filtros
`search`, `categoria`, `per_page` e `page`, cacheia a resposta por 60s e converte
qualquer falha do upstream em um 502 com corpo previsível.

---

## Deploy

Servido em `clubedolivro.qualitytransportes.com.br`, como processo Node standalone atrás
do Apache (porta `3002`, serviço systemd `clube-do-livro.service`).

**Configure `LIVROS_API_URL` e `API_V1_URL` no host.** Sem elas o app cai no padrão
`http://127.0.0.1:8001/...`, que não existe em produção. A API do Laravel também
precisa estar acessível publicamente a partir do servidor onde este app roda — e as
capas (`imagem_url`) precisam ser alcançáveis pelo browser de quem visita.

Depois de alterações no código, repita os passos abaixo — pular o último é o motivo
mais comum de uma atualização não aparecer no site:

```bash
npm run build

# modo standalone não inclui esses diretórios; copiar à mão
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cp .env .next/standalone/.env

sudo systemctl restart clube-do-livro.service
```

O servidor standalone carrega o código em memória na inicialização — sem o `restart`,
ele continua servindo a versão antiga mesmo com um build novo em disco.

---

## Autenticação

Login e cadastro funcionam, ligados aos endpoints Sanctum do `Sistema-Quality`.

O token nunca chega ao JavaScript da página: as rotas `/api/auth/*` do Next conversam com
o Laravel e guardam o token num cookie `httpOnly` chamado `clube_token`. Isso o protege de
XSS — diferente de `localStorage`, que qualquer script na página consegue ler.

Quem se cadastra pelo clube recebe o papel `LIVROS` no servidor. O login aceita `LIVROS`
ou `MOTORISTA`, já que a API é compartilhada com o sistema de motoristas.

Dois detalhes:

- Senha mínima de **8 caracteres**, definida pelo servidor (`Rules\Password::defaults()`).
- O telefone pode ir com máscara: o servidor normaliza para dígitos antes de validar.

Retirada e devolução funcionam ponta a ponta. A regra "só quem retirou devolve" é
garantida no servidor, dentro da própria consulta que localiza o empréstimo em aberto —
não dá para devolver livro de outra pessoa mesmo chamando a API direto.

Cada pessoa pode estar com **1 livro por vez**. O limite é aplicado no servidor, dentro da
transação e com trava na linha do usuário — dois pedidos simultâneos para livros diferentes
não furam a regra. A tela desabilita o botão antes disso, mas quem chamar a API direto
recebe 409 `LIMITE_ATINGIDO`.

Falta prever a **devolução administrativa**: se alguém sai do clube ou perde o livro, o
exemplar fica preso, porque só o portador consegue devolver.

---

## Histórico

Este app já teve Supabase (autenticação e as tabelas `books`, `retiradas`, `devolucoes`
e `sugestoes`) e notificações WhatsApp via ZAPI, cobrindo retirada, devolução, sugestão
de livros e login. O projeto Supabase foi apagado — o host parou de resolver em DNS — e
tudo isso foi removido em 20/08/2026. O código está no git, no commit `c820377`.
