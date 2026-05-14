# 🏐 Rachinha API

API para gerenciamento de reservas de quadras esportivas. Desenvolvida com **FastAPI**, **MongoDB** e **JWT Auth**, seguindo os princípios da **Clean Architecture**.

---

## 🚀 Features

* Autenticação de usuários (login via e-mail ou nome de usuário)
* Criação e listagem de reservas
* Verificação de conflitos de horário
* Restrições de duração mínima (1h) e múltiplos de 30 minutos

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
git clone https://github.com/Atena-Labs/rachinha_back.git
cd rachinha_back
```

### 2. Instale as dependências

```bash
pip install -r requirements.txt
```

### 3. Configure o arquivo `.env`

Crie um arquivo `.env` (ou mude o nome do arquivo `.env.example` ) com:

```
MONGODB_URL: str = "mongodb://localhost:27017"
DB_NAME: str = "rachinha"
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

A API estará disponível em: [http://localhost:8000](http://localhost:8000)

O MongoDB estará disponível na porta padrão: `27017`

### 3. Parar os containers

```bash
docker-compose down
```
