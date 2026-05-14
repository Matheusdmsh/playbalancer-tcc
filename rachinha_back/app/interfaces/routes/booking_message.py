from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from app.domain.repositories.notification_repository import NotificationRepository
from app.interfaces.schemas.booking_message import BookingMessageCreate, BookingMessageInDB
from app.core.security import get_current_user_ws, get_current_user
from app.domain.repositories.booking_message_repository import MessageRepository
from app.domain.repositories.booking_repository import BookingRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.court_repository import CourtRepository
from app.services.booking_message_service import MessageService
from app.core.config import get_db
import json
from typing import List

from app.services.notification_service import NotificationConnectionManager, NotificationService


router = APIRouter(prefix="/bookings/chat", tags=["Bookings Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, booking_id: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if booking_id not in self.active_connections:
            self.active_connections[booking_id] = {}
        self.active_connections[booking_id][user_id] = websocket

    def disconnect(self, booking_id: str, user_id: str):
        if booking_id in self.active_connections and user_id in self.active_connections[booking_id]:
            del self.active_connections[booking_id][user_id]
            if not self.active_connections[booking_id]:
                del self.active_connections[booking_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, booking_id: str, message: dict):
        if booking_id in self.active_connections:
            for user_id, connection in self.active_connections[booking_id].items():
                try:
                    # Serializa o dicionário para string JSON com default=str para garantir
                    # que objetos datetime/ObjectId sejam convertidos.
                    await connection.send_text(json.dumps(message, default=str))
                except RuntimeError as e:
                    # Em produção, você pode querer logar isso para um sistema de logs
                    print(f"Erro ao enviar mensagem para {user_id} no booking {booking_id}: {e}")

manager = ConnectionManager()

@router.get("/history/{booking_id}", response_model=List[BookingMessageInDB])
async def get_chat_history(
    booking_id: str,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    message_repo = MessageRepository(db)
    booking_repo = BookingRepository(db)
    user_repo = UserRepository(db)
    court_repo = CourtRepository(db)
    service = MessageService(message_repo, booking_repo, user_repo, court_repo)
    try:
        messages = await service.get_chat_booking_messages(user["_id"], booking_id)
        return messages
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        # Em produção, você deve logar a exceção 'e' aqui.
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{booking_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    booking_id: str,
    db=Depends(get_db),
    user=Depends(get_current_user_ws)
):
    message_repo = MessageRepository(db)
    booking_repo = BookingRepository(db)
    user_repo = UserRepository(db)
    court_repo = CourtRepository(db)
    # Correctly create NotificationService with user_repo
    service = MessageService(message_repo, booking_repo, user_repo, court_repo, notification_service=NotificationService(NotificationRepository(db), NotificationConnectionManager(), user_repo))

    user_id = str(user["_id"])

    try:
        # Verifica a permissão do usuário para o chat.
        await service._check_chat_permission(user_id, booking_id)
    except ValueError as e:
        # Se a permissão for negada, fecha o WebSocket com 403.
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=str(e))
        return

    try:
        # Conecta o WebSocket e adiciona ao gerenciador de conexões.
        await manager.connect(booking_id, user_id, websocket)
    except WebSocketDisconnect:
        # Lida com desconexões que podem ocorrer durante o handshake inicial.
        manager.disconnect(booking_id, user_id)
        await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
        return
    except Exception as e:
        # Captura qualquer outro erro que impeça a conexão.
        # Em produção, logue 'e'.
        manager.disconnect(booking_id, user_id)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason=f"Erro ao conectar: {type(e).__name__}")
        return

    try:
        # Loop principal para receber e processar mensagens.
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                
                # Adiciona booking_id e sender_id ao dicionário da mensagem (seguro no backend).
                message_data["booking_id"] = booking_id
                message_data["sender_id"] = user_id

                # Cria o objeto MessageCreate para validação Pydantic.
                message_create_obj = BookingMessageCreate(**message_data) 

                # Salva a mensagem e obtém o dicionário serializado para broadcast.
                saved_message_dict = await service.save_booking_message(user_id, message_create_obj)

                if saved_message_dict:
                    # Transmite a mensagem para todos os clientes conectados neste booking.
                    await manager.broadcast(booking_id, saved_message_dict)
                else:
                    # Se save_message retornar vazio, notifica o remetente.
                    await manager.send_personal_message(json.dumps({"error": "Falha ao salvar mensagem."}), websocket)

            except Exception as e:
                # Captura erros durante o processamento de uma mensagem (ex: formato inválido).
                # Em produção, logue 'e'.
                await manager.send_personal_message(json.dumps({"error": f"Erro ao processar mensagem: {str(e)}"}), websocket)
                continue

    except WebSocketDisconnect:
        # Lida com desconexões normais do WebSocket durante o uso.
        manager.disconnect(booking_id, user_id)
        # Em produção, você pode querer logar a desconexão.
    except Exception as e:
        # Captura erros inesperados no loop principal do WebSocket.
        # Em produção, logue 'e'.
        manager.disconnect(booking_id, user_id)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason=f"Erro inesperado no loop: {type(e).__name__}")