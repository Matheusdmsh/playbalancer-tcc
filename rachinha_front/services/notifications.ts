import api from "./api";
import Cookies from 'js-cookie';

const TOKEN_COOKIE_NAME = 'rachinha_token';

export interface Notification {
  _id: string;
  user_id: string;
  notification_type: "group_invitation" | "booking_invitation" | "new_group_message" | "new_booking_message" | 'booking_removal';
  message: string;
  related_id: string;
  link: string;
  is_read: boolean;
  created_at: string; // ISO date string
}

export interface UnreadCountResponse {
  unread_count: number;
}

// Fetch all notifications for the current user
export async function getMyNotifications(): Promise<Notification[]> {
  try {
    const response = await api.get<Notification[]>('/notifications/my');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao buscar notificações";
    throw new Error(message);
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const response = await api.get<UnreadCountResponse>('/notifications/unread/count');
    return response.data.unread_count;
  } catch (error: any) {
    return 0;
  }
}

export async function markAsRead(notificationId: string): Promise<void> {
  try {
    await api.post(`/notifications/${notificationId}/read`);
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao marcar notificação como lida";
    throw new Error(message);
  }
}

export async function markAllAsRead(): Promise<{ message: string }> {
  try {
    const response = await api.post('/notifications/read/all');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao marcar todas as notificações como lidas";
    throw new Error(message);
  }
}

type NotificationCallback = (notification: Notification) => void;
type UnreadCountCallback = (count: number) => void;
type ErrorCallback = (error: string) => void;

export class NotificationSocket {
  private ws: WebSocket | null = null;
  private onNewNotification: NotificationCallback | null = null;
  private onUnreadUpdate: UnreadCountCallback | null = null;
  private onError: ErrorCallback | null = null;

  connect(
    onNewNotification: NotificationCallback,
    onUnreadUpdate: UnreadCountCallback,
    onError: ErrorCallback
  ) {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.warn("Notification WebSocket is already connected.");
      return;
    }

    this.onNewNotification = onNewNotification;
    this.onUnreadUpdate = onUnreadUpdate;
    this.onError = onError;

    const wsBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/^http/, "ws");
    const token = Cookies.get(TOKEN_COOKIE_NAME);
    if (!token) {
        onError("Usuário não autenticado para conectar ao WebSocket.");
        return;
    }
    const wsUrl = `${wsBaseUrl}/notifications/ws?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => console.log("Conectado ao WebSocket de notificações.");

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'new_notification' && payload.data) {
          this.onNewNotification?.(payload.data);
        }
        if (payload.type === 'unread_count_update' && typeof payload.unread_count !== 'undefined') {
          this.onUnreadUpdate?.(payload.unread_count);
        }
      } catch (e) {
        this.onError?.("Erro ao processar notificação recebida.");
      }
    };

    this.ws.onerror = (event) => {
      console.error("Notification WebSocket Error:", event);
      this.onError?.("Ocorreu um erro na conexão de notificações.");
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket de notificações desconectado: ${event.code} - ${event.reason}`);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}