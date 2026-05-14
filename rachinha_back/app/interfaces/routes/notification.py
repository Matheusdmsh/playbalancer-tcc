from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from typing import List
from app.core.config import get_db
from app.core.security import get_current_user, get_current_user_ws
from app.domain.repositories.notification_repository import NotificationRepository
from app.services.notification_service import NotificationService, manager
from app.interfaces.schemas.notification import NotificationInDB
from app.domain.repositories.user_repository import UserRepository 

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def get_notification_service(db=Depends(get_db)) -> NotificationService:
    return NotificationService(NotificationRepository(db), manager, UserRepository(db))

@router.get("/my", response_model=List[NotificationInDB])
async def get_my_notifications(
    user=Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    return await service.get_notifications_for_user(user["_id"])

@router.get("/unread/count")
async def get_unread_notification_count(
    user=Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    count = await service.get_unread_count_for_user(user["_id"])
    return {"unread_count": count}

@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_as_read(
    notification_id: str,
    user=Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    success = await service.mark_notification_as_read(notification_id, user["_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Notificação não encontrada ou já lida.")
    return

@router.post("/read/all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_as_read(
    user=Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    modified_count = await service.mark_all_user_notifications_as_read(user["_id"])
    return {"message": f"{modified_count} notificações marcadas como lidas."}


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user=Depends(get_current_user_ws),
    service: NotificationService = Depends(get_notification_service)
):
    user_id = str(user["_id"])
    await manager.connect(user_id, websocket)
    try:
        # Enviar contagem inicial de não lidas ao conectar
        initial_unread_count = await service.get_unread_count_for_user(user_id)
        await websocket.send_json({"type": "unread_count_update", "unread_count": initial_unread_count})
        
        while True:
            # Mantém a conexão aberta para receber notificações
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)