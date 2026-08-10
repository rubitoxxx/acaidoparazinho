# Açaí do Parazinho

Sistema de reservas e entregas para o Açaí do Parazinho — backend em Node.js/Express + Prisma (SQLite) e frontend estático (HTML/JS) servido pelo próprio servidor, com autenticação/perfil via Firebase.

## Estrutura

```
src/            código do backend (Express)
  app.js        configuração do app (middlewares, rotas, arquivos estáticos)
  server.js     ponto de entrada (sobe o servidor + inicializa o banco)
  controllers/  regras de negócio por recurso
  routes/       definição das rotas da API (/api/...)
  middlewares/  auth, tratamento de erros
  prisma/       cliente do Prisma
prisma/
  schema.prisma modelo do banco de dados
  seed.js       dados iniciais (admin, categoria e produtos padrão)
public/         frontend estático (index.html = loja pro cliente, loja.html = painel)
firestore.rules regras de segurança do Firestore (perfis de usuário via Firebase)
```

## Rodando localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha os valores (chaves do Firebase, segredos JWT, PIN de admin):
   ```bash
   cp .env.example .env
   ```
3. Rode o app:
   ```bash
   npm run dev
   ```

O servidor sobe em `http://localhost:3000`, aplica o schema do Prisma automaticamente e roda o seed inicial (usuário admin, categoria e produtos padrão) se o banco estiver vazio.

## Scripts

- `npm run dev` / `npm start` — sobe o servidor
- `npm run prisma:generate` — gera o client do Prisma
- `npm run prisma:push` — aplica o schema no banco
- `npm run prisma:seed` — roda o seed manualmente

## Deploy

Configurado para deploy no Railway (`railway.json`, build via Nixpacks).

## Segurança

Nunca commite o arquivo `.env` — ele fica de fora do repositório via `.gitignore`. Use `.env.example` como modelo.
