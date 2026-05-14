from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone
from app.interfaces.schemas.notification import NotificationInDB

class NotificationRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["notifications"]

    def _serialize_notification(self, notification: dict) -> dict:
        if notification:
            if "_id" in notification and notification["_id"] is not None:
                notification["_id"] = str(notification["_id"])
            if "user_id" in notification and notification["user_id"] is not None:
                notification["user_id"] = str(notification["user_id"])
            if "related_id" in notification and notification["related_id"] is not None:
                notification["related_id"] = str(notification["related_id"])
        return notification

    async def create(self, notification_data: dict) -> dict:
        notification_data['user_id'] = ObjectId(notification_data['user_id'])
        notification_data['related_id'] = ObjectId(notification_data['related_id'])
        notification_data['created_at'] = datetime.now(timezone.utc)
        notification_data['is_read'] = False
        result = await self.collection.insert_one(notification_data)
        new_notification = await self.collection.find_one({"_id": result.inserted_id})
        return self._serialize_notification(new_notification)

    async def get_by_user(self, user_id: str, limit: int = 50) -> List[dict]:
        notifications = await self.collection.find(
            {"user_id": ObjectId(user_id)}
        ).sort("created_at", -1).to_list(length=limit)
        return [self._serialize_notification(n) for n in notifications]

    async def get_unread_count(self, user_id: str) -> int:
        return await self.collection.count_documents({
            "user_id": ObjectId(user_id), 
            "is_read": False
        })

    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        result = await self.collection.update_one(
            {"_id": ObjectId(notification_id), "user_id": ObjectId(user_id)},
            {"$set": {"is_read": True}}
        )
        return result.modified_count > 0

    async def mark_all_as_read(self, user_id: str) -> int:
        result = await self.collection.update_many(
            {"user_id": ObjectId(user_id), "is_read": False},
            {"$set": {"is_read": True}}
        )
        return result.modified_count