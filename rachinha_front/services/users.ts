import { User } from "@/interface/users"; // Presumindo que esta interface já exista
import api from "./api";
import { getToken } from "./authService";
import { jwtDecode, JwtPayload } from "jwt-decode";

// --- Tipos e Interfaces para maior segurança ---

type EditUserInput = Partial<Omit<User, 'id' | 'email'>>; // Exemplo: não permitir editar ID ou email

export interface UserSearchResult extends User {
  // Pode ter campos adicionais ou diferentes, ajuste conforme necessário
}

function isGhostLikeUsername(username?: string): boolean {
  if (!username) return false;
  return /^ghost_/i.test(username) || /^fake/i.test(username);
}

// --- Função Utilitária para Tratamento de Erros ---

/**
 * Centraliza o tratamento de erros da API para evitar repetição de código.
 * @param error - O objeto de erro capturado no bloco catch.
 * @param defaultMessage - Mensagem padrão a ser usada se nenhuma outra for encontrada.
 * @returns Um objeto de Erro.
 */
function handleApiError(error: any, defaultMessage: string): Error {
  const message =
    error?.response?.data?.detail ||  // Padrão do FastAPI para erros de validação
    error?.response?.data?.message || // Um padrão comum para mensagens de erro
    error?.message ||                 // Erro genérico da requisição
    defaultMessage;                   // Mensagem de fallback
  return new Error(message);
}

// --- Funções do Serviço ---

/**
 * Busca os dados do usuário atualmente autenticado.
 * @returns Os dados do usuário.
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await api.get<User>("/users/me");
    return { ...response.data, id: response.data.id }; // Garante a consistência do campo 'id'
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar os dados do usuário");
  }
}

/**
 * Lista os IDs dos grupos favoritos do usuário autenticado.
 */
export async function getMyFavoriteGroups(): Promise<string[]> {
  try {
    const response = await api.get<string[]>("/users/me/favorite-groups");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw handleApiError(error, "Erro ao listar grupos favoritos");
  }
}

/**
 * Adiciona um grupo aos favoritos do usuário autenticado.
 */
export async function addGroupToFavorites(groupId: string): Promise<{ detail: string }> {
  try {
    const response = await api.post<{ detail: string }>(`/users/me/favorite-groups/${groupId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao favoritar grupo");
  }
}

/**
 * Remove um grupo dos favoritos do usuário autenticado.
 */
export async function removeGroupFromFavorites(groupId: string): Promise<{ detail: string }> {
  try {
    const response = await api.delete<{ detail: string }>(`/users/me/favorite-groups/${groupId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao remover grupo dos favoritos");
  }
}

export function getUserDataFromToken() {
  const token = getToken();
  if (!token) {
    return null;
  }
  try {
    const decodedToken = jwtDecode(token);
    return decodedToken;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

/**
 * Busca uma lista de usuários com base em seus IDs.
 * @param userIds - Um array com os IDs dos usuários a serem buscados.
 * @returns Uma Promessa que resolve para um array de Usuários.
 */
export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  try {
    // Enviamos o array userIds diretamente como o corpo da requisição.
    const response = await api.post<User[]>("/users/users_by_ids", userIds);
    
    // Mapeia _id para id para manter a consistência no frontend
    return response.data.map(user => ({...user, id: user.id}));
  } catch (error) {
    // A função de tratamento de erro que implementamos continua válida
    throw handleApiError(error, "Erro ao buscar os membros da turma");
  }
}

/**
 * Atualiza os dados do usuário autenticado.
 * @param userData - Um objeto contendo os campos do usuário a serem atualizados.
 * @returns Os dados do usuário atualizado.
 */
export async function editCurrentUser(userData: EditUserInput): Promise<User> {
  try {
    const response = await api.put<User>("/users/me", userData);
    return { ...response.data, id: response.data.id };
  } catch (error) {
    throw handleApiError(error, "Erro ao atualizar os dados do usuário");
  }
}

/**
 * Confirma o endereço de e-mail de um usuário usando um token.
 * @param token - O token de verificação recebido por e-mail.
 */
export async function verifyEmail(token: string): Promise<{ message: string }> {
  try {
    const response = await api.get(`/users/verify-email/${token}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao verificar o e-mail");
  }
}

/**
 * Inicia o processo de redefinição de senha para um e-mail.
 * @param email - O e-mail do usuário que esqueceu a senha.
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  try {
    const response = await api.post("/users/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao solicitar a redefinição de senha");
  }
}

/**
 * Reseta a senha do usuário usando um token e a nova senha.
 * @param token - O token de redefinição recebido por e-mail.
 * @param new_password - A nova senha do usuário.
 */
export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  try {
    const response = await api.post("/users/reset-password", { token, new_password });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao redefinir a senha");
  }
}

export interface UserSearchParams {
  group_id?: string;
  booking_id?: string;
  include_ghosts?: boolean;
}

/**
 * Busca usuários na plataforma por nome ou nome de usuário.
 * @param query - O termo de busca.
 * @param params - Parâmetros opcionais de filtro.
 * @returns Uma lista de usuários encontrados.
 */
export async function searchUsers(query: string, params?: UserSearchParams): Promise<UserSearchResult[]> {
  if (!query || query.trim().length < 1) {
    return []; // Retorna vazio se a busca for inválida para não sobrecarregar o backend
  }
  try {
    const response = await api.get<UserSearchResult[]>(`/users/search`, {
      params: {
        q: query,
        ...(params?.group_id ? { group_id: params.group_id } : {}),
        ...(params?.booking_id ? { booking_id: params.booking_id } : {}),
        ...(typeof params?.include_ghosts === "boolean"
          ? { include_ghosts: params.include_ghosts }
          : {}),
      }
    });
    // Garante consistencia de id e normaliza placeholders retornados pela API de busca.
    return response.data.map((user) => ({
      ...user,
      id: user.id,
      is_placeholder: Boolean(user.is_placeholder) || isGhostLikeUsername(user.username),
    }));
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar usuários");
  }
}

/** 
 * Mudar senha de um usuário autenticado.
 * @param oldPassword - A senha antiga do usuário.
 * @param newPassword - A nova senha do usuário.
 * @param confirmNewPassword - A confirmação da nova senha.
*/
export async function changePassword(
  oldPassword: string,
  newPassword: string,
  confirmNewPassword: string
): Promise<{ message: string }> {
  try {
    const response = await api.put("/users/change-password", {
      current_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao mudar a senha");
  }
}

/**
 * Cria um usuário fantasma.
 * @param name - O nome do usuário fantasma.
 * @param email - O e-mail opcional do usuário fantasma.
 * @returns O usuário fantasma criado.
 */
export async function createGhostUser(name: string, email?: string): Promise<User> {
  try {
    const response = await api.post<User>("/users/ghost", { name, email });
    return { ...response.data, id: response.data.id };
  } catch (error) {
    throw handleApiError(error, "Erro ao criar usuário fantasma");
  }
}

/**
 * Atualiza o e-mail de um usuário fantasma e reenvia o convite.
 * @param userId - O ID do usuário fantasma.
 * @param email - O novo e-mail do usuário.
 * @returns Uma mensagem de sucesso.
 */
export async function updateGhostUserEmail(userId: string, email: string): Promise<{ message: string }> {
  try {
    const response = await api.put(`/users/ghost/${userId}/email`, { email });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao atualizar e-mail do usuário fantasma");
  }
}

/**
 * Atualiza a role do usuário autenticado.
 * @param role - A nova role do usuário.
 * @returns Os dados do usuário atualizado.
 */
export async function updateUserRole(role: string): Promise<User> {
  try {
    const response = await api.put<User>("/users/me/role", { role });
    return { ...response.data, id: response.data.id };
  } catch (error) {
    throw handleApiError(error, "Erro ao atualizar a role do usuário");
  }
}