import { Invite } from "@/interface/invite";
import { handleApiError } from "@/lib/utils";
import api from "./api";

interface InviteActionResponse {
  detail: string;
  booking_id: string;
}

/**
 * Aceita um convite para um agendamento (racha).
 * @param bookingId - O ID do agendamento.
 * @param inviteId - O ID do convite.
 * @returns Uma mensagem de confirmação.
 */
export async function acceptBookingInvite(bookingId: string, inviteId: string): Promise<InviteActionResponse> {
  try {
    const response = await api.post<InviteActionResponse>(`/bookings/${bookingId}/invite/${inviteId}/accept`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao aceitar o convite");
  }
}

/**
 * Recusa um convite para um agendamento (racha).
 * @param bookingId - O ID do agendamento.
 * @param inviteId - O ID do convite.
 * @returns Uma mensagem de confirmação.
 */
export async function declineBookingInvite(bookingId: string, inviteId: string): Promise<InviteActionResponse> {
  try {
    const response = await api.post<InviteActionResponse>(`/bookings/${bookingId}/invite/${inviteId}/decline`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao recusar o convite");
  }
}

/**
 * Busca todos os convites de agendamento para o usuário logado.
 * @returns Uma lista de convites.
 */
export async function getMyBookingInvites(): Promise<Invite[]> {
  try {
    const response = await api.get<Invite[]>('/bookings/invites/my');
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar seus convites");
  }
}
