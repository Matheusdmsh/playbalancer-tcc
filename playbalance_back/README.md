# ⚖️ PlayBalance API

API do PlayBalance para organização de grupos esportivos, partidas, presença, sorteio de times e controle de caixa. Desenvolvida com **FastAPI**, **MongoDB** e autenticação **JWT**.

---

## 🚀 Features

* Autenticação de usuários (login via e-mail ou nome de usuário)
* Criação e gerenciamento de grupos esportivos
* Agendamento de partidas pontuais e confirmação de presença
* Sorteio equilibrado de times e controle de caixa
* Confirmação de e-mail e redefinição de senha por SMTP

---

## 📆 Tecnologias

* [FastAPI](https://fastapi.tiangolo.com/)
* [MongoDB + Motor](https://motor.readthedocs.io/)
* [Pydantic](https://docs.pydantic.dev/)
* [JWT - jose](https://python-jose.readthedocs.io/)
* [Docker](https://www.docker.com/)

---

## 📁 Estrutura de pastas

```
app/
├── core/              # Configurações e utilitários (segurança, env)
├── domain/
│   └── repositories/  # Acesso ao banco de dados
├── interfaces/
│   └── schemas/       # Pydantic Schemas
│   └── routes/       # Rotas da API
├── services/          # Regras de negócio

```

---

## 🧪 Endpoints principais

| Método | Rota                  | Descrição                      |
| ------ | --------------------- | ------------------------------ |
| POST   | `/auth/login`         | Login via JSON (email/usuário) |
| POST   | `/auth/login/swagger` | Login para Swagger (form)      |
| GET    | `/bookings/my`        | Listar reservas do usuário     |
| POST   | `/bookings/`          | Criar nova reserva             |

---

## 🛡️ Autenticação

A autenticação é feita via **JWT**.

Para testar no Swagger UI:

1. Use a rota `/auth/login/swagger`
2. Copie o token retornado
3. Clique em "Authorize" no topo da documentação
4. Cole o token no formato: `Bearer <token>`

---

## 🏗️ Como rodar localmente

### 1. Clone o repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd playbalance_back
```

### 2. Instale as dependências

```bash
pip install -r requirements.txt
```

### 3. Configure o arquivo `.env`

Crie um arquivo `.env` (ou mude o nome do arquivo `.env.example` ) com:

```
MONGODB_URL: str = "mongodb://localhost:27017"
DB_NAME: str = "playbalance"
JWT_SECRET: str = "segredo_super_secreto"
```

### 4. Rode a aplicação

```bash
uvicorn main:app --reload
```

---

## 🐳 Rodando com Docker

### 1. Requisitos

* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)

### 2. Suba os containers

```bash
docker-compose up --build
```

A API estará disponível em: [http://localhost:8001/api_playbalance/](http://localhost:8001/api_playbalance/)

O MongoDB estará disponível localmente na porta `27019`.

### 3. Parar os containers

```bash
docker-compose down
```
# Publicação na Vercel

O backend pode ser publicado na Vercel usando `main.py` como entrada do FastAPI.
Na criação do projeto, selecione `playbalance_back` como diretório raiz e configure
as variáveis de ambiente no painel da Vercel. Em produção, `MONGODB_URL` deve usar
a URL do MongoDB Atlas, enquanto `ROOT_PATH` deve permanecer `/api_playbalance`.
