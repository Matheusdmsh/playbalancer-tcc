import { Invite } from "@/interface/invite";
import api from "./api";

/**
 * Aceita um convite para um agendamento (racha).
 * @param bookingId - O ID do agendamento.
 * @param inviteId - O ID do convite.
 * @returns Uma mensagem de confirmação.
 */
export async function acceptBookingInvite(bookingId: string, inviteId: string): Promise<{ detail: string, booking_id: string }> {
  try {
    const response = await api.post(`/bookings/${bookingId}/invite/${inviteId}/accept`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao aceitar o convite";
    throw new Error(message);
  }
}

/**
 * Recusa um convite para um agendamento (racha).
 * @param bookingId - O ID do agendamento.
 * @param inviteId - O ID do convite.
 * @returns Uma mensagem de confirmação.
 */
export async function declineBookingInvite(bookingId: string, inviteId: string): Promise<{ detail: string, booking_id: string }> {
  try {
    const response = await api.post(`/bookings/${bookingId}/invite/${inviteId}/decline`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao recusar o convite";
    throw new Error(message);
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
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao buscar seus convites";
    throw new Error(message);
  }
}