import { handleApiError } from "@/lib/utils";
import api from "./api";
import { Arena, ArenaCreate, ArenaUpdate } from "@/interface/arena"; 


export async function createArena(arenaData: ArenaCreate): Promise<Arena> {
  try {
    const response = await api.post<Arena>("/arenas/create", arenaData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao criar a arena");
  }
}


/**
 * Lista todas as arenas do usuário logado.
 */
export async function listMyArenas(): Promise<Arena[]> {
  try {
    const response = await api.get<Arena[]>("/arenas/myarenas");
    // O backend retorna _id, mapeamos para id para consistência no frontend
    return response.data.map(arena => ({ ...arena, id: (arena as any)._id }));
  } catch (error) {
    throw handleApiError(error, "Erro ao listar suas arenas");
  }
}

/**
 * Edita uma arena existente.
 */
export async function editArena(arenaId: string, arenaData: ArenaUpdate): Promise<{ detail: string }> {
  try {
    const response = await api.put(`/arenas/edit/${arenaId}`, arenaData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao editar a arena");
  }
}

/**
 * Deleta uma arena existente.
 */
export async function deleteArena(arenaId: string): Promise<{ detail: string }> {
  try {
    const response = await api.delete(`/arenas/delete/${arenaId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao deletar a arena");
  }
}
