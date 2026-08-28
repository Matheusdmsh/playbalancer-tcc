import { Booking } from "@/interface/booking";
import { handleApiError } from "@/lib/utils";
import api from "./api";

interface DetailResponse {
  detail: string;
}

export interface BookingCreateData {
  start_time: string;
  end_time: string;
  modality: string;
  max_players?: number;
  players?: Booking["players"];
  reserve_players?: Booking["reserve_players"];
  associated_group_id?: string;
  location?: Booking["location"];
  status_list?: boolean;
  price?: number | null;
  price_type?: Booking["price_type"] | null;
}

export interface CreateBookingResponse {
  ids: string[];
}

export interface PlayerSkillResponse {
  status: "skill_level_updated";
  booking_id: string;
  player_id: string;
  booking_avg: number;
}

export interface PlayerVoteResponse {
  status: "vote_registered";
  booking_id: string;
  player_id: string;
  vote_score: number;
  total_votes: number;
}

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
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar os rachas da turma");
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
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar dados da reserva");
  }
}

/**
 * Adiciona um jogador a uma reserva.
 * @param bookingId - O ID da reserva.
 * @param playerId - O ID do jogador.
 * @param skillLevel - O nível de habilidade, quando precisar ser definido explicitamente.
 */
export async function addPlayerToBooking(bookingId: string, playerId: string, skillLevel?: number): Promise<DetailResponse> {
    try {
    const params = new URLSearchParams({ player_id: playerId });
    if (typeof skillLevel !== "undefined") {
      params.set("skill_level", String(skillLevel));
    }
    const response = await api.post<DetailResponse>(`/bookings/${bookingId}/invite/add?${params.toString()}`);
        return response.data;
    } catch (error) {
        throw handleApiError(error, "Erro ao adicionar jogador.");
    }
}

/**
 * Remove um jogador de uma reserva.
 * @param bookingId - O ID da reserva.
 * @param playerId - O ID do jogador.
 */
export async function removePlayerFromBooking(bookingId: string, playerId: string): Promise<DetailResponse> {
    try {
        const response = await api.post<DetailResponse>(`/bookings/${bookingId}/invite/remove?player_id=${playerId}`);
        return response.data;
    } catch (error) {
        throw handleApiError(error, "Erro ao remover jogador.");
    }
}

/**
 * Atualiza o nível de habilidade de um jogador em uma reserva.
 * @param bookingId - O ID da reserva.
 * @param playerId - O ID do jogador.
 * @param skillLevel - O novo nível de habilidade (0-5).
 */
export async function updatePlayerSkillLevel(bookingId: string, playerId: string, skillLevel: number): Promise<PlayerSkillResponse> {
  try {
    const response = await api.put<PlayerSkillResponse>(
      `/bookings/${bookingId}/player/${playerId}/skill_level`,
      {},
      { params: { skill_level: skillLevel } }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao atualizar habilidade.");
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
    const response = await api.post<OrganizeTeamsResult>(`/bookings/${bookingId}/organize-teams?players_per_team=${playersPerTeam}`, payload);
        return response.data;
    } catch (error) {
        throw handleApiError(error, "Erro ao organizar times.");
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
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar histórico de sorteios.");
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
  } catch (error) {
    throw handleApiError(error, "Erro ao limpar sorteio de times.");
  }
}

/**
 * Cria um novo agendamento (racha).
 * @param data - Os dados do agendamento a ser criado.
 * @returns O agendamento criado.
 */
export async function createBooking(data: BookingCreateData): Promise<CreateBookingResponse> {
  try {
    const response = await api.post<CreateBookingResponse>('/bookings/', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao criar o racha");
  }
}

export async function updateBooking(bookingId: string, bookingData: Partial<Booking>): Promise<DetailResponse> {
  try {
    const response = await api.put<DetailResponse>(`/bookings/edit/${bookingId}`, bookingData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao atualizar o agendamento");
  }
}

export async function cancelBooking(bookingId: string): Promise<DetailResponse> {
  try {
    const payload = { status: 'cancelled' }; 
    const response = await api.put<DetailResponse>(`/bookings/edit/${bookingId}`, payload);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao cancelar o racha");
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
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar os rachas da turma");
  }
}

/**
 * Registra um voto Tinder para um jogador confirmado de uma reserva.
 * @param bookingId - O ID da reserva.
 * @param playerId - O ID do jogador avaliado.
 * @param vote - Voto: -1 (ruim), 0 (neutro), 1 (bom).
 */
export async function voteBookingPlayer(bookingId: string, playerId: string, vote: BookingPlayerVote): Promise<PlayerVoteResponse> {
  try {
    const response = await api.post<PlayerVoteResponse>(
      `/bookings/${bookingId}/player/${playerId}/vote`,
      {},
      { params: { vote } }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao registrar avaliação.");
  }
}
