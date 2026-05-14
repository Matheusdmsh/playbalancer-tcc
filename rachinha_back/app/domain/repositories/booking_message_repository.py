from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone

class MessageRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["booking_messages"]

    async def create_booking_message(self, message_data: dict) -> str:
        message_data["timestamp"] = datetime.now(timezone.utc) # Adiciona timestamp ao criar
        result = await self.collection.insert_one(message_data)
        return str(result.inserted_id)

    async def get_messages_by_booking_id(self, booking_id: str, limit: int = 50) -> List[dict]:
        messages = await self.collection.find({"booking_id": booking_id}).sort("timestamp", 1).to_list(length=limit)
        for msg in messages:
            msg["_id"] = str(msg["_id"])
            # Opcional: converter sender_id para string se for ObjectId
            if "sender_id" in msg and isinstance(msg["sender_id"], ObjectId):
                msg["sender_id"] = str(msg["sender_id"])
        return messages