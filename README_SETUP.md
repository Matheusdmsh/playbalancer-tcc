# PlayBalancer — Setup rápido (Frontend + Backend)

Este arquivo descreve os passos mínimos para executar o projeto em desenvolvimento na máquina local usando Docker (backend) e `pnpm` (frontend).

1) Backend (Docker Compose)

- Subir os serviços (backend + mongo):

```bash
cd rachinha_back
docker compose up --build -d
```

- Verificar logs do backend:

```bash
docker compose logs -f rachinha_backend
```

- Quando subir, a rota de health estará em:

```
http://localhost:8001/rachinha/
```

- Copie o `rachinha_back/.env.example` para `rachinha_back/.env` e preencha os segredos (por ex. `JWT_SECRET`, `GOOGLE_CLIENT_ID`, etc.).

- Rodar migrações (opcional / caso precise reexecutar):

```bash
docker compose exec rachinha_backend python migrate_group_admins.py
docker compose exec rachinha_backend python migrate_user_card_template.py
docker compose exec rachinha_backend python migrate_user_sport_ratings.py
```

2) Frontend (desenvolvimento)

- Instalar dependências (se ainda não instalou):

```bash
cd rachinha_front
pnpm install
```

- Arquivo de ambiente local: copie `rachinha_front/.env.example` para `rachinha_front/.env.local` e ajuste `NEXT_PUBLIC_API_URL` para `http://localhost:8001/rachinha` (padrão criado).

- Iniciar dev server:

```bash
pnpm dev
```

- O frontend estará disponível em:

```
http://localhost:3000
```

3) Dicas para desenvolver e testar

- Após alterar código frontend, o Next.js recarrega automaticamente.
- Para alterar configurações do backend, edite `rachinha_back/.env` e reinicie o container: `docker compose restart rachinha_backend`.
- Para ver o estado dos containers: `docker ps`.

4) Se algo falhar

- Consulte `docker compose logs -f rachinha_backend` e `pnpm dev` (frontend terminal).
- Verifique se `ALLOWED_ORIGINS` inclui `http://localhost:3000` para evitar problemas CORS.
