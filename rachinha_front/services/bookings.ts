import { Booking } from "@/interface/booking";
import api from "./api";

export interface OrganizeTeamsResult {
  teams: string[][];
  team_skills_sum: number[];
  reserves?: string[];
}

export interface OrganizeTeamsHistoryItem {
  drawn_at: string;
  drawn_by_user_id: string;
  drawn_by_name: string;
  players_per_team: number;
  selected_player_ids: string[];
  result: OrganizeTeamsResult;
}

export interface ClearOrganizedTeamsResponse {
  status: "organized_teams_cleared";
  booking_id: string;
}

export type BookingPlayerVote = -1 | 0 | 1;

/**
 * Busca todos os agendamentos (rachas) de um grupo específico.
 * @param groupId - O ID do grupo.
 * @returns Uma lista de agendamentos.
 */
export async function getBookingsByGroupId(groupId: string): Promise<Booking[]> {
  try {
    const response = await api.get<Booking[]>(`/bookings/bygroup/${groupId}`);
    console.log("Bookings fetched:", response.data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao buscar os rachas da turma";
    throw new Error(message);
  }
}


/**
 * Busca uma ou mais reservas pelos seus IDs.
 * @param bookingIds - Array de IDs das reservas.
 * @returns Uma lista de reservas.
 */
export async function getBookingsByIds(bookingIds: string[]): Promise<Booking[]> {
  try {
    const response = await api.post<Booking[]>('/bookings/by_ids', bookingIds);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao buscar dados da reserva";
    throw new Error(message);
  }
}

/**
 * Adiciona um jogador a uma reserva.
 * @param bookingId - O ID da reserva.
 * @param playerId - O ID do jogador.
 * @param skillLevel - O nível de habilidade, quando precisar ser definido explicitamente.
 */
export async function addPlayerToBooking(bookingId: string, playerId: string, skillLevel?: number): Promise<any> {
    try {
    const params = new URLSearchParams({ player_id: playerId });
    if (typeof skillLevel !== "undefined") {
      params.set("skill_level", String(skillLevel));
    }
    const response = await api.post(`/bookings/${bookingId}/invite/add?${params.toString()}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.detail || "Erro ao adicionar jogador.");
    }
}

/**
 * Remove um jogador de uma reserva.
 * @param bookingId - O ID da reserva.
 * @param playerId - O ID do jogador.
 */
export async function removePlayerFromBooking(bookingId: string, playerId: string): Promise<any> {
    try {
        const response = await api.post(`/bookings/${bookingId}/invite/remove?player_id=${playerId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.detail || "Erro ao remover jogador.");
    }
}

/**
 * Atualiza o nível de habilidade de um jogador em uma reserva.
 * @param bookingId - O ID da reserva.
 * @param playerId - O ID do jogador.
 * @param skillLevel - O novo nível de habilidade (0-5).
 */
export async function updatePlayerSkillLevel(bookingId: string, playerId: string, skillLevel: number): Promise<any> {
  try {
    const response = await api.put(
      `/bookings/${bookingId}/player/${playerId}/skill_level`,
      {},
      { params: { skill_level: skillLevel } }
    );
    return response.data;
  } catch (error: any) {
    let message = "Erro ao atualizar habilidade.";
    if (error.response?.data?.detail) {
      message = typeof error.response.data.detail === 'string' 
        ? error.response.data.detail 
        : JSON.stringify(error.response.data.detail);
    } else if (error.message) {
      message = error.message;
    }
    throw new Error(message);
  }
}

/**
 * Organiza os times de uma reserva.
 * @param bookingId - O ID da reserva.
 * @param playersPerTeam - Número de jogadores por time.
 */
export async function organizeTeams(bookingId: string, playersPerTeam: number, selectedPlayerIds?: string[]): Promise<OrganizeTeamsResult> {
    try {
    const payload = selectedPlayerIds && selectedPlayerIds.length > 0
      ? { selected_player_ids: selectedPlayerIds }
      : undefined;
    const response = await api.post(`/bookings/${bookingId}/organize-teams?players_per_team=${playersPerTeam}`, payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.detail || "Erro ao organizar times.");
    }
}

/**
 * Busca o histórico de sorteios de times de uma reserva.
 * @param bookingId - O ID da reserva.
 */
export async function getOrganizeTeamsHistory(bookingId: string): Promise<{ history: OrganizeTeamsHistoryItem[] }> {
  try {
    const response = await api.get<{ history: OrganizeTeamsHistoryItem[] }>(`/bookings/${bookingId}/organize-teams/history`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Erro ao buscar histórico de sorteios.");
  }
}

/**
 * Limpa o sorteio atual de times de uma reserva.
 * Importante: o histórico de sorteios permanece preservado no backend.
 * @param bookingId - O ID da reserva.
 */
export async function clearOrganizedTeams(bookingId: string): Promise<ClearOrganizedTeamsResponse> {
  try {
    const response = await api.delete<ClearOrganizedTeamsResponse>(`/bookings/${bookingId}/organize-teams`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Erro ao limpar sorteio de times.");
  }
}

/**
 * Cria um novo agendamento (racha).
 * @param data - Os dados do agendamento a ser criado.
 * @returns O agendamento criado.
 */
export async function createBooking(data: any): Promise<any> {
  try {
    const response = await api.post('/bookings/', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao criar o racha";
    throw new Error(message);
  }
}

export async function updateBooking(bookingId: string, bookingData: Partial<Booking>): Promise<Booking> {
  try {
    const response = await api.put<Booking>(`/bookings/edit/${bookingId}`, bookingData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao atualizar o agendamento";
    throw new Error(message);
  }
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  try {
    const payload = { status: 'cancelled' }; 
    const response = await api.put<Booking>(`/bookings/edit/${bookingId}`, payload);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao cancelar o racha";
    throw new Error(message);
  }
}

/**
 * Busca todos os agendamentos (rachas) de um usuário específico.
 * @param userId - O ID do usuário.
 * @returns Uma lista de agendamentos.
 */
export async function getBookingsByUserId(userId: string): Promise<Booking[]> {
  try {
    const response = await api.get<Booking[]>(`/bookings/byuser/${userId}`);
    console.log("Bookings fetched:", response.data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao buscar os rachas da turma";
    throw new Error(message);
  }
}

/**
 * Registra um voto Tinder para um jogador confirmado de uma reserva.
 * @param bookingId - O ID da reserva.
 * @param playerId - O ID do jogador avaliado.
 * @param vote - Voto: -1 (ruim), 0 (neutro), 1 (bom).
 */
export async function voteBookingPlayer(bookingId: string, playerId: string, vote: BookingPlayerVote): Promise<any> {
  try {
    const response = await api.post(
      `/bookings/${bookingId}/player/${playerId}/vote`,
      {},
      { params: { vote } }
    );
    return response.data;
  } catch (error: any) {
    let message = "Erro ao registrar avaliação.";
    if (error.response?.data?.detail) {
      message = typeof error.response.data.detail === "string"
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
    } else if (error.message) {
      message = error.message;
    }
    throw new Error(message);
  }
}