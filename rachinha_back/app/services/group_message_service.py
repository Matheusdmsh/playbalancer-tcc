from datetime import datetime
from app.domain.repositories.group_repository import GroupRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.group_message_repository import GroupMessageRepository
from app.interfaces.schemas.group_message import GroupMessageCreate
from typing import List, Optional
from bson import ObjectId
from app.services.notification_service import NotificationService 
from app.interfaces.schemas.notification import NotificationCreate

class GroupMessageService:
    def __init__(self, group_message_repo: GroupMessageRepository, group_repo: GroupRepository, user_repo: UserRepository, notification_service: Optional[NotificationService] = None):
        self.group_message_repo = group_message_repo
        self.group_repo = group_repo
        self.user_repo = user_repo
        self.notification_service = notification_service

    async def _check_group_chat_permission(self, user_id: str, group_id: str) -> bool:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise ValueError("Group not found.")

        is_group_owner = str(user_id) == str(group.get("owner_id"))
        is_group_member = any(str(user_id) == str(member.get("id")) for member in group.get("members", []))

        can_access_chat = is_group_owner or is_group_member

        if not can_access_chat:
            raise ValueError("You do not have permission to access this group chat.")
        return True

    async def get_chat_messages(self, user_id: str, group_id: str, skip: int, limit: int) -> List[dict]:
        await self._check_group_chat_permission(user_id, group_id)
        messages = await self.group_message_repo.get_messages_by_group_id(group_id, skip=skip, limit=limit)
        return messages

    async def save_message(self, user_id: str, message_create_data: GroupMessageCreate) -> dict:
        if str(user_id) != str(message_create_data.sender_id):
             raise ValueError("The sender_id in the message does not match the authenticated user.")

        group_id = message_create_data.group_id

        await self._check_group_chat_permission(user_id, group_id)

        message_data_to_save = {
            "group_id": group_id,
            "sender_id": user_id,
            "content": message_create_data.content
        }
        
        message_id = await self.group_message_repo.create_message(message_data_to_save)
        print(self.notification_service)
        if message_id and self.notification_service:
            group = await self.group_repo.get_by_id(group_id)
            sender_user = await self.user_repo.get_user_by_id(user_id)
            
            for member in group.get('members', []):
                member_id = member.get('id')
                if str(member_id) != str(user_id):  # Não notificar o remetente
                    notification = NotificationCreate(
                        user_id=str(member_id),
                        notification_type="new_group_message",
                        message=f"Nova mensagem de {sender_user['name']} no grupo '{group['name']}'.",
                        related_id=group_id,
                        link=f"/user/chat/{group_id}"
                    )
                    await self.notification_service.create_and_send_notification(notification)

        message_from_db = await self.group_message_repo.collection.find_one({"_id": ObjectId(message_id)}) 
        
        if message_from_db:
            serialized_message = {}
            for k, v in message_from_db.items():
                if isinstance(v, ObjectId):
                    serialized_message[k] = str(v)
                elif isinstance(v, datetime):
                    serialized_message[k] = v.isoformat()
                elif isinstance(v, list):
                    serialized_message[k] = [
                        str(item) if isinstance(item, ObjectId) 
                        else (item.isoformat() if isinstance(item, datetime) else item) 
                        for item in v
                    ]
                else:
                    serialized_message[k] = v
            return serialized_message
        return {}