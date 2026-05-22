# Clube do Livro

Aplicação web para gestão do acervo e retiradas de um clube do livro.  
Stack: **Next.js 16 · TypeScript · Tailwind CSS v4 · SQLite (better-sqlite3)**

---

## Rotas

| Rota | Descrição | Protegida por senha |
|---|---|---|
| `/` | Acervo, retirada e devolução de livros | Não |
| `/cadastrar` | Cadastrar ou editar livro | Sim |
| `/retiradas` | Histórico de retiradas | Sim |
| `/excluir` | Excluir livro do acervo | Sim (no momento da exclusão) |

---

## Desenvolvimento local

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # build de produção
npm run lint      # ESLint
npx tsc --noEmit  # type-check
```

Crie um arquivo `.env.local` na raiz com a senha de administrador:

```env
NEXT_PUBLIC_ADMIN_PASSWORD=SuaSenhaAqui
```

O banco SQLite é criado automaticamente em `data/books.db` na primeira execução.

---

## Deploy em servidor Windows

### Pré-requisitos

Instale os programas abaixo no servidor Windows:

| Programa | Link | Observação |
|---|---|---|
| **Node.js LTS** | https://nodejs.org | Versão 20 ou superior |
| **Git** | https://git-scm.com | Para clonar o repositório |
| **Nginx para Windows** | https://nginx.org/en/download.html | Reverse proxy |
| **PM2** | via npm (ver abaixo) | Gerenciador de processos |

Após instalar o Node.js, instale o PM2 globalmente:

```powershell
npm install -g pm2
npm install -g pm2-startup
```

---

### 1. Copiar os arquivos para o servidor

Clone o repositório (ou copie os arquivos manualmente) para uma pasta do servidor.  
Sugestão de caminho: `C:\apps\clube_livro`

```powershell
git clone <url-do-repositorio> C:\apps\clube_livro
cd C:\apps\clube_livro
```

---

### 2. Configurar variáveis de ambiente

Crie o arquivo `C:\apps\clube_livro\.env.local`:

```env
NEXT_PUBLIC_ADMIN_PASSWORD=SuaSenhaAqui
```

> **Importante:** este arquivo não está no repositório (é ignorado pelo `.gitignore`).  
> Guarde a senha em local seguro.

---

### 3. Instalar dependências e fazer o build

```powershell
cd C:\apps\clube_livro
npm install
npm run build
```

---

### 4. Criar a pasta do banco de dados

O SQLite precisa que a pasta `data\` exista antes da primeira execução:

```powershell
mkdir C:\apps\clube_livro\data
```

---

### 5. Iniciar a aplicação com PM2

```powershell
cd C:\apps\clube_livro
pm2 start npm --name "clube-livro" -- start
pm2 save
```

Verifique se está rodando:

```powershell
pm2 status
pm2 logs clube-livro
```

A aplicação estará disponível em `http://localhost:3000`.

---

### 6. Configurar inicialização automática no boot do Windows

```powershell
pm2-startup install
```

Siga as instruções exibidas no terminal. Isso configura o PM2 como serviço do Windows via Task Scheduler, garantindo que a aplicação reinicie automaticamente após reinicialização do servidor.

---

### 7. Configurar o Nginx como reverse proxy

Extraia o Nginx para `C:\nginx`. Substitua o conteúdo de `C:\nginx\conf\nginx.conf`:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;

    # Redireciona HTTP → HTTPS
    server {
        listen 80;
        server_name seusubdominio.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name seusubdominio.com;

        ssl_certificate     C:/nginx/ssl/cert.pem;
        ssl_certificate_key C:/nginx/ssl/key.pem;

        location / {
            proxy_pass         http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection 'upgrade';
            proxy_set_header   Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

> Substitua `seusubdominio.com` pelo seu subdomínio real.

Inicie o Nginx:

```powershell
cd C:\nginx
start nginx
```

Para que o Nginx inicie automaticamente com o Windows, adicione-o como tarefa agendada ou use o [NSSM](https://nssm.cc) para registrá-lo como serviço.

---

### 8. Certificado SSL (HTTPS)

Use o **win-acme** para obter um certificado gratuito via Let's Encrypt:

1. Baixe em: https://www.win-acme.com
2. Execute `wacs.exe` como administrador
3. Escolha o domínio e siga o assistente
4. Aponte os caminhos do certificado gerado para `ssl_certificate` e `ssl_certificate_key` no `nginx.conf`

> O win-acme renova o certificado automaticamente a cada 60 dias.

---

### 9. Liberar portas no Firewall do Windows

Abra o PowerShell como administrador:

```powershell
New-NetFirewallRule -DisplayName "HTTP"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

---

### Arquitetura em produção

```
Internet → porta 443 (HTTPS)
    └── Nginx (reverse proxy + SSL)
            └── localhost:3000 (Next.js via PM2)
                    └── data/books.db (SQLite)
```

---

### Comandos úteis no servidor

```powershell
pm2 status                  # status da aplicação
pm2 logs clube-livro        # logs em tempo real
pm2 restart clube-livro     # reiniciar após atualização
pm2 stop clube-livro        # parar

nginx -s reload             # recarregar config do Nginx sem derrubar
nginx -s stop               # parar o Nginx
```

### Atualizar a aplicação

```powershell
cd C:\apps\clube_livro
git pull
npm install
npm run build
pm2 restart clube-livro
```
