# app/services/notification_service.py
import json
from fastapi import WebSocket
from typing import Dict, List
from app.domain.repositories.notification_repository import NotificationRepository
from app.domain.repositories.user_repository import UserRepository
from app.interfaces.schemas.notification import NotificationCreate
import firebase_admin
from firebase_admin import credentials, messaging


try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
except Exception as e:
    print(f"Erro ao inicializar o Firebase Admin: {e}")

class NotificationConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_notification(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(message, default=str))

manager = NotificationConnectionManager()

class NotificationService:
    def __init__(self, notification_repo: NotificationRepository, ws_manager: NotificationConnectionManager, user_repo: 'UserRepository'):
        self.notification_repo = notification_repo
        self.ws_manager = ws_manager
        self.user_repo = user_repo

    async def send_push_notification(self, user_id: str, title: str, body: str):
        user = await self.user_repo.get_user_by_id(user_id)
        if user and user.get('fcm_token'):
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                token=user['fcm_token'],
            )
            try:
                response = messaging.send(message)
                print('Notificação push enviada com sucesso:', response)
            except Exception as e:
                print(f"Erro ao enviar notificação push: {e}")

    async def create_and_send_notification(self, notification_create: NotificationCreate):

        created_notification = await self.notification_repo.create(notification_create.dict())
        

        unread_count = await self.notification_repo.get_unread_count(notification_create.user_id)

        payload = {
            "type": "new_notification",
            "data": created_notification,
            "unread_count": unread_count
        }
        await self.ws_manager.send_notification(notification_create.user_id, payload)
        
        await self.send_push_notification(
            user_id=notification_create.user_id,
            title="Nova Notificação",
            body=notification_create.message
        )

        return created_notification
    
    async def get_notifications_for_user(self, user_id: str) -> List[dict]:
        return await self.notification_repo.get_by_user(user_id)

    async def get_unread_count_for_user(self, user_id: str) -> int:
        return await self.notification_repo.get_unread_count(user_id)

    async def mark_notification_as_read(self, notification_id: str, user_id: str) -> bool:
        return await self.notification_repo.mark_as_read(notification_id, user_id)
        
    async def mark_all_user_notifications_as_read(self, user_id: str) -> int:
        return await self.notification_repo.mark_all_as_read(user_id)