import api from "./api";
import Cookies from 'js-cookie';

const TOKEN_COOKIE_NAME = 'rachinha_token'; 

export interface GroupMessage {
  _id: string;
  group_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
}

export interface LastMessageResponse {
  [groupId: string]: GroupMessage | null;
}

export async function getGroupChatHistory(
  groupId: string,
  skip: number = 0,
  limit: number = 50
): Promise<GroupMessage[]> {
  try {
    const response = await api.get<GroupMessage[]>(
      `/groups/chat/history/${groupId}`,
      {
        params: { skip, limit },
      }
    );
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || "Erro ao buscar histórico de mensagens";
    throw new Error(message);
  }
}

export async function getLastMessagesForGroups(
  groupIds: string[]
): Promise<LastMessageResponse> {
  try {
    const response = await api.post<LastMessageResponse>(
      "/groups/chat/last_messages",
      { group_ids: groupIds }
    );
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || "Erro ao buscar últimas mensagens";
    throw new Error(message);
  }
}

// --- CLASSE DE GERENCIAMENTO DO WEBSOCKET ---

type MessageCallback = (message: GroupMessage) => void;
type ErrorCallback = (error: string) => void;

export class GroupChatSocket {
  private ws: WebSocket | null = null;
  private onMessageCallback: MessageCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;

  connect(groupId: string, onMessage: MessageCallback, onError: ErrorCallback) {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.warn("WebSocket já está conectado.");
      return;
    }

    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    
    // --- CORREÇÃO APLICADA AQUI ---
    // Alterado o URL de fallback para apontar para o backend local por padrão.
    // Para produção, defina a variável de ambiente NEXT_PUBLIC_API_URL.
    const wsBaseUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    ).replace(/^http/, "ws");
    const wsUrl = `${wsBaseUrl}/groups/chat/ws/${groupId}?token=${Cookies.get(TOKEN_COOKIE_NAME)}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log(`Conectado ao WebSocket do grupo ${groupId}`);
    };

    this.ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        if (messageData.error) {
          this.onErrorCallback?.(messageData.error);
        } else {
          this.onMessageCallback?.(messageData);
        }
      } catch (e) {
        this.onErrorCallback?.("Erro ao processar mensagem recebida.");
      }
    };

    this.ws.onerror = (event) => {
      console.error("WebSocket Error:", event);
      this.onErrorCallback?.(
        "Ocorreu um erro na conexão com o chat."
      );
    };

    this.ws.onclose = (event) => {
      // O backend fecha a conexão com código 1008 (Policy Violation) em caso de falha de autenticação.
      if (event.code === 1008) { 
         console.error(`Desconectado do chat: ${event.reason}`);
         this.onErrorCallback?.(`Falha na autenticação: ${event.reason || 'Credenciais inválidas.'}`);
      } else {
         console.log(`Desconectado do chat: ${event.code} - ${event.reason}`);
      }
    };
  }

  sendMessage(content: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ content }));
    } else {
      this.onErrorCallback?.(
        "Não foi possível enviar a mensagem. Conexão não está aberta."
      );
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}