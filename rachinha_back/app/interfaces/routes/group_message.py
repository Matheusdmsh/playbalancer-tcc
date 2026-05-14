from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, WebSocketException, status
from app.domain.repositories.notification_repository import NotificationRepository
from app.interfaces.schemas.group_message import GroupIdsRequest, GroupMessageCreate, GroupMessageInDB
from app.core.security import get_current_user_ws, get_current_user
from app.domain.repositories.group_message_repository import GroupMessageRepository
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.user_repository import UserRepository
from app.services.group_message_service import GroupMessageService
from app.core.config import get_db
import json
from typing import Any, Dict, List, Optional

from app.services.notification_service import NotificationConnectionManager, NotificationService

router = APIRouter(prefix="/groups/chat", tags=["Group Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, group_id: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = {}
        self.active_connections[group_id][user_id] = websocket

    def disconnect(self, group_id: str, user_id: str):
        if group_id in self.active_connections and user_id in self.active_connections[group_id]:
            del self.active_connections[group_id][user_id]
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, group_id: str, message: dict):
        if group_id in self.active_connections:
            for user_id, connection in self.active_connections[group_id].items():
                try:
                    await connection.send_text(json.dumps(message, default=str))
                except RuntimeError as e:
                    print(f"Erro ao enviar mensagem para {user_id} no grupo {group_id}: {e}")

manager = ConnectionManager()

@router.get("/history/{group_id}", response_model=List[GroupMessageInDB])
async def get_group_chat_history(
    group_id: str,
    skip: int = 0,
    limit: int = 50,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    group_message_repo = GroupMessageRepository(db)
    group_repo = GroupRepository(db)
    user_repo = UserRepository(db)
    service = GroupMessageService(group_message_repo, group_repo, user_repo)
    try:
        messages = await service.get_chat_messages(user["_id"], group_id, skip, limit)
        return messages
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico de mensagens do grupo.")

@router.websocket("/ws/{group_id}")
async def websocket_endpoint_group(
    websocket: WebSocket,
    group_id: str,
    db=Depends(get_db),
    user=Depends(get_current_user_ws) # A autenticação e o accept() acontecem aqui!
):
    user_id = str(user["_id"])
    
    # Inicialização dos serviços e repositórios
    group_message_repo = GroupMessageRepository(db)
    group_repo = GroupRepository(db)
    user_repo = UserRepository(db)
    notification_repo = NotificationRepository(db)
    notification_manager = NotificationConnectionManager()
    notification_service = NotificationService(notification_repo, notification_manager, user_repo)
    service = GroupMessageService(group_message_repo, group_repo, user_repo, notification_service=notification_service)

    try:
        # A permissão é verificada após a autenticação bem-sucedida
        await service._check_group_chat_permission(user_id, group_id)
        
        await manager.connect(group_id, user_id, websocket)

        # Loop para receber e processar mensagens
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            message_data["group_id"] = group_id
            message_data["sender_id"] = user_id
            message_create_obj = GroupMessageCreate(**message_data)
            saved_message_dict = await service.save_message(user_id, message_create_obj)

            if saved_message_dict:
                await manager.broadcast(group_id, saved_message_dict)
            else:
                await manager.send_personal_message(json.dumps({"error": "Falha ao salvar mensagem no grupo."}), websocket)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        pass
    finally:
        # Garante que a desconexão seja registrada no gerenciador
        manager.disconnect(group_id, user_id)
        pass



@router.post("/last_messages", response_model=Dict[str, Optional[Dict[str, Any]]])
async def get_last_messages_for_groups(
    request: GroupIdsRequest,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Recebe uma lista de IDs de turmas e retorna a última mensagem de cada uma.
    """
    repo = GroupMessageRepository(db)
    try:
        last_messages = await repo.get_last_message_for_each_group(request.group_ids)
        return last_messages
    except Exception as e:
        # Em um app de produção, você deveria logar o erro 'e'
        raise HTTPException(status_code=500, detail="Erro interno ao buscar últimas mensagens.")