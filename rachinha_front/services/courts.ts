import api from "./api";
import { Court, CourtCreate, CourtUpdate } from "@/interface/courts";
import { handleApiError } from "@/lib/utils";

/**
 * Cria uma nova quadra.
 * @param courtData - Os dados da nova quadra.
 */
export async function createCourt(courtData: CourtCreate): Promise<Court> {
  try {
    const response = await api.post<Court>("/courts/create", courtData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao criar a quadra");
  }
}

/**
 * Lista todas as quadras de uma arena específica.
 * @param arenaId - O ID da arena.
 */
export async function listCourtsByArena(arenaId: string): Promise<Court[]> {
  try {
    const response = await api.get<Court[]>(`/courts/listCourtsByArena/${arenaId}`);
    // Mapeia o _id retornado pelo backend para o campo id no frontend
    return response.data.map(court => ({ ...court, id: (court as any)._id }));
  } catch (error) {
    throw handleApiError(error, "Erro ao listar as quadras");
  }
}

/**
 * Edita uma quadra existente.
 * @param courtId - O ID da quadra a ser editada.
 * @param courtData - Os novos dados da quadra.
 */
export async function editCourt(courtId: string, courtData: CourtUpdate): Promise<{ detail: string }> {
  try {
    const response = await api.put(`/courts/edit/${courtId}`, courtData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao editar a quadra");
  }
}

/**
 * Deleta uma quadra existente.
 * @param courtId - O ID da quadra a ser deletada.
 */
export async function deleteCourt(courtId: string): Promise<{ detail: string }> {
  try {
    const response = await api.delete(`/courts/delete/${courtId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao deletar a quadra");
  }
}
