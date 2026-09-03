# PlayBalance — Guia rápido de execução

Este guia explica como executar o PlayBalance localmente para desenvolvimento e testes. O projeto possui um frontend em Next.js e um backend FastAPI com MongoDB em Docker.

## 1. Pré-requisitos

- Docker Desktop em execução;
- Node.js e `pnpm` instalados;
- Arquivos de ambiente configurados, sem enviar credenciais ao Git.

## 2. Backend e banco de dados

No terminal, entre na pasta do backend e inicie os contêineres:

```bash
cd playbalance_back
docker compose up --build -d
```

Os serviços locais iniciados são:

- API: `http://localhost:8001/api_playbalance`;
- documentação da API: `http://localhost:8001/api_playbalance/docs`;
- MongoDB: porta local `27019`.

Para acompanhar os logs:

```bash
docker compose logs -f backend
```

O arquivo de variáveis locais é `playbalance_back/.env`. Caso seja a primeira configuração, use `playbalance_back/.env.example` como referência e preencha, no mínimo:

- `JWT_SECRET`;
- `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM`;
- `FRONTEND_URL=http://localhost:3000`;
- `ALLOWED_ORIGINS=http://localhost:3000`.

Após alterar o `.env`, reinicie o backend:

```bash
docker compose restart backend
```

## 3. Frontend

Em outro terminal, entre na pasta do frontend:

```bash
cd playbalance_front
pnpm install
pnpm dev
```

O site ficará disponível em:

```text
http://localhost:3000
```

Em desenvolvimento, o frontend encaminha automaticamente as chamadas para a API por meio de `/api-proxy/api_playbalance`. O arquivo `playbalance_front/.env.local` já deve conter:

```text
NEXT_PUBLIC_API_URL=/api-proxy/api_playbalance
```

## 4. Verificações rápidas

- Para consultar os contêineres: `docker ps`.
- Para parar os serviços do backend: execute `docker compose down` dentro de `playbalance_back`.
- Para encerrar o frontend, pressione `Ctrl + C` no terminal em que `pnpm dev` está rodando.
- Alterações no frontend são recarregadas automaticamente pelo Next.js.

## 5. Observação para publicação

Antes de colocar o PlayBalance em uma URL pública, atualize `FRONTEND_URL`, `ALLOWED_ORIGINS`, `COOKIE_SECURE` e `NEXT_PUBLIC_API_URL` conforme o domínio e a hospedagem escolhidos.
