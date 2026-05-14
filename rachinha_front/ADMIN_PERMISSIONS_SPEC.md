# 📡 Especificação de Permissões e Endpoints - Sistema de Admins

## 🔐 Estrutura de Permissões

### Owner (Super Admin)
- ✅ Pode adicionar/remover admins
- ✅ Pode deletar o grupo
- ✅ Pode transferir ownership
- ✅ Todas as permissões de admin

### Admin
- ✅ Adicionar/remover membros
- ✅ Editar informações do grupo
- ✅ Gerar links de convite
- ✅ Atualizar skill levels
- ✅ Gerenciar transações

---

## 📍 Endpoints Disponíveis

### 1. Adicionar Admin
```
POST /groups/{group_id}/admins/{user_id}

Requisitos:
- Apenas o owner pode adicionar admins
- Retorna o grupo atualizado com lista de admins

Response:
{
  "_id": "...",
  "name": "Turma do Pagode",
  "owner_id": "691c7bfbe55cbb0b32402829",
  "admins": ["691c7bfbe55cbb0b32402829", "novo_admin_id"],
  ...
}
```

### 2. Remover Admin
```
DELETE /groups/{group_id}/admins/{user_id}

Requisitos:
- Apenas o owner pode remover admins
- Não pode remover o próprio owner
- Retorna o grupo atualizado
```

### 3. Listar Admins
```
GET /groups/{group_id}/admins

Response:
{
  "admins": ["691c7bfbe55cbb0b32402829", "outro_id_admin"]
}

Nota: Inclui o owner na lista
```

---

## 📦 Estrutura do Grupo Retornada

```typescript
{
  "_id": string,
  "name": string,
  "photo_url"?: string | null,
  "owner_id": string,           // ← NOVO: ID do dono
  "admins": string[],           // ← NOVO: Array com IDs dos admins
  "members": Player[],
  "modality"?: string | null,
  "arena"?: string | null,
  "price"?: number | null,
  "price_type"?: "per_person" | "total_split",
  "recurrence"?: string[],
  "start_time"?: string,        // HH:MM:SS
  "duration"?: number,          // em minutos
  "created_at": string,
  "updated_at": string,
  "invite_token"?: string | null
}
```

---

## 🛠️ Como Verificar Permissões no Frontend

### Verificar se é Owner
```typescript
const isOwner = group.owner_id === currentUserId;
```

### Verificar se é Admin (Owner OU na lista de admins)
```typescript
const isAdmin = group.owner_id === currentUserId || 
                group.admins?.includes(currentUserId);
```

### Verificar se é Membro Regular
```typescript
const isMember = !isAdmin && group.members?.some(m => m.id === currentUserId);
```

---

## 📋 Checklist de Implementação

### Tela de Configurações - Permissões (novo)
- [ ] Listar todos os admins com opção de remover (apenas owner)
- [ ] Campo para adicionar novo admin (apenas owner)
- [ ] Indicador visual de owner vs admin
- [ ] Botão para deletar grupo (apenas owner)
- [ ] Botão para transferir ownership (apenas owner)

### Validações Frontend
- [ ] Esconder opções de admin se não for owner
- [ ] Esconder opções de edição se não for admin
- [ ] Mostrar badge "Owner" e "Admin" apropriadamente

### Integração com API
- [ ] POST /groups/{id}/admins/{userId}
- [ ] DELETE /groups/{id}/admins/{userId}
- [ ] GET /groups/{id}/admins
- [ ] Atualizar interface Group com `admins` array

### Atualização de Interfaces TypeScript
- [ ] Adicionar `owner_id` em `Group`
- [ ] Adicionar `admins` em `Group`
- [ ] Criar tipos para respostas dos endpoints de admin

---

## 🎯 Próximas Etapas

1. **Atualizar interface Group** em `services/groups.ts`
2. **Criar funções de API** para endpoints de admin
3. **Implementar tela de Permissões** na seção do EditGroupSheet
4. **Adicionar validações** baseadas em permissões
5. **Atualizar componentes** para mostrar badges de Owner/Admin

---

## 💾 Referência de Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `owner_id` | string | ID do usuário dono do grupo (super admin) |
| `admins` | string[] | Array com IDs de todos os admins (inclui owner) |
| `members` | Player[] | Lista de todos os membros do grupo |

---

## 🔗 Relacionamento de Permissõess

```
Owner (owner_id)
├─ Pode tudo
├─ Adicionar/remover admins
├─ Deletar grupo
└─ Transferir ownership

Admins (em admins[])
├─ Gerenciar membros
├─ Editar grupo
├─ Gerenciar transações
└─ NÃO pode gerenciar admins

Membros (em members[])
└─ Apenas visualizar/participar
```

---

**Status**: ✅ Especificação Completa
**Data**: 19 de fevereiro de 2026
**Pronto para**: Iniciar desenvolvimento
