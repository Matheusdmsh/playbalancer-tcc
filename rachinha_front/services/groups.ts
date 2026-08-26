import api from "./api"
import { handleApiError } from "@/lib/utils"

export interface Player {
  _id: string
  id: string
  name?: string
  skill_level?: number | null
  is_placeholder?: boolean
}

export interface Group {
  name: string
  photo_url?: string | null
  members: Player[] | null
  modality?: string | null
  _id: string
  owner_id: string
  admins?: string[] | null
  created_at: string
  updated_at: string
  invite_token?: string | null;
  arena?: string | null
  price?: number | null
  price_type?: "per_person" | "total_split" | null
  recurrence?: string[] | null
  start_time?: string | null
  duration?: number | null
}

export interface GroupCreateData {
  name: string
  modality?: string | null
  arena?: string | null
  price?: number | null
  price_type?: string | null
  recurrence?: string[] | null
  start_time?: string | null
  end_time?: string | null
}

export interface GroupUpdateData {
    name?: string
    modality?: string | null
    arena?: string | null
    price?: number | null
    price_type?: string | null
    recurrence?: string[] | null
    start_time?: string | null
    duration?: number | null
    invite_token?: string | null
}


export async function createGroup(groupData: GroupCreateData): Promise<Group> {
  try {
    const response = await api.post<Group>("/groups/create", groupData)
    return response.data
  } catch (error) {
    throw handleApiError(error, "Erro ao criar grupo")
  }
}

export async function listMyGroups(): Promise<Group[]> {
  try {
    const response = await api.get<Group[]>("/groups/mygroups")
    return response.data
  } catch (error) {
    throw handleApiError(error, "Erro ao listar grupos")
  }
}

// Nova função para editar
export async function editGroup(groupId: string, groupData: GroupUpdateData): Promise<Group> {
    try {
      const response = await api.put<Group>(`/groups/edit/${groupId}`, groupData)
      return response.data
    } catch (error) {
      throw handleApiError(error, "Erro ao editar o grupo")
    }
}
  
// Nova função para deletar
export async function deleteGroup(groupId: string): Promise<void> {
    try {
        await api.delete(`/groups/delete/${groupId}`)
    } catch (error) {
        throw handleApiError(error, "Erro ao excluir o grupo")
    }
}

export async function getGroupById(groupId: string): Promise<Group> {
  try {
    const response = await api.get<Group>(`/groups/${groupId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar dados do grupo");
  }
}

/**
 * Adiciona um membro a um grupo.
 * @param groupId - O ID do grupo.
 * @param memberId - O ID do membro a ser adicionado.
 * @param skillLevel - O nível de habilidade do membro.
 * @returns O grupo atualizada.
 */
export async function addMemberToGroup(groupId: string, memberId: string, skillLevel: number): Promise<Group> {
  try {
    // A requisição POST agora envia o skill_level como um query param
    const response = await api.post<Group>(`/groups/${groupId}/members/${memberId}`, null, {
      params: {
        group_id: groupId,
        member_id: memberId,
        skill_level: skillLevel
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao adicionar membro ao grupo.");
  }
}

/**
 * Remove um membro de um grupo.
 * @param groupId - O ID do grupo.
 * @param memberId - O ID do membro a ser removido.
 */
export async function removeMemberFromGroup(groupId: string, memberId: string): Promise<Group> {
  try {
    const response = await api.delete<Group>(`/groups/${groupId}/members/${memberId}`, {
      params: {
        group_id: groupId,
        member_id: memberId
      }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao remover membro");
  }
}


/**
 * Gera ou regenera o link de convite para um grupo.
 * @param groupId - O ID do grupo.
 * @returns O link de convite.
 */
export async function generateInviteLink(
  groupId: string
): Promise<{ invite_link: string }> {
  try {
    const response = await api.post<{ invite_link: string }>(
      `/groups/${groupId}/invite-link`
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao gerar link de convite");
  }
}

/**
 * Busca os detalhes de um grupo usando um token de convite.
 * @param inviteToken - O token do convite.
 * @returns Os dados do grupo.
 */
export async function getGroupByInviteToken(inviteToken: string): Promise<Group> {
  try {
    const response = await api.get<Group>(`/groups/invite/${inviteToken}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar dados do grupo pelo convite");
  }
}

/**
 * Permite que um usuário logado entre em um grupo usando um link de convite.
 * @param inviteToken - O token do convite.
 * @returns O grupo que o usuário entrou.
 */
export async function joinGroupWithLink(inviteToken: string): Promise<Group> {
  try {
    const response = await api.post<Group>(`/groups/join/${inviteToken}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao entrar no grupo com o link");
  }
}

/**
 * Adiciona um admin a um grupo.
 * @param groupId - O ID do grupo.
 * @param userId - O ID do usuário a ser adicionado como admin.
 * @returns O grupo atualizado com a lista de admins.
 */
export async function addAdminToGroup(groupId: string, userId: string): Promise<Group> {
  try {
    const response = await api.post<Group>(`/groups/${groupId}/admins/${userId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao adicionar admin");
  }
}

/**
 * Remove um admin de um grupo.
 * @param groupId - O ID do grupo.
 * @param userId - O ID do admin a ser removido.
 * @returns O grupo atualizado.
 */
export async function removeAdminFromGroup(groupId: string, userId: string): Promise<Group> {
  try {
    const response = await api.delete<Group>(`/groups/${groupId}/admins/${userId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao remover admin");
  }
}

/**
 * Transfere o dono de um grupo.
 * @param groupId - O ID do grupo.
 * @param newOwnerId - O ID do novo dono.
 * @returns O grupo atualizado.
 */
export async function transferGroupOwner(groupId: string, newOwnerId: string): Promise<Group> {
  try {
    const response = await api.put<Group>(`/groups/${groupId}/transfer-owner/${newOwnerId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao transferir dono");
  }
}

/**
 * Lista todos os admins de um grupo.
 * @param groupId - O ID do grupo.
 * @returns Array com os IDs dos admins.
 */
export async function getGroupAdmins(groupId: string): Promise<string[]> {
  try {
    const response = await api.get<{ admins: string[] }>(`/groups/${groupId}/admins`);
    return response.data.admins;
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar admins");
  }
}

/**
 * Atualiza o nível de habilidade de um membro do grupo.
 * @param groupId - O ID do grupo.
 * @param memberId - O ID do membro.
 * @param skillLevel - O novo nível de habilidade (0-5).
 */
export async function updateMemberSkillLevel(groupId: string, memberId: string, skillLevel: number): Promise<Group> {
  try {
    const response = await api.put<Group>(
      `/groups/${groupId}/members/${memberId}/skill`,
      {},
      { params: { skill_level: skillLevel } }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao atualizar habilidade do membro");
  }
}
