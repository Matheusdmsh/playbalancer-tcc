from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Union
from bson import ObjectId
from datetime import datetime, timezone

class ConnectionRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["connections"]

    async def create_connection(self, connection_data: dict) -> str:
        if "created_at" not in connection_data:
            connection_data["created_at"] = datetime.now(timezone.utc)
        
        # Ensure user_id is ObjectId if it's a string
        if "user_id" in connection_data and isinstance(connection_data["user_id"], str):
            connection_data["user_id"] = ObjectId(connection_data["user_id"])
            
        result = await self.collection.insert_one(connection_data)
        return str(result.inserted_id)

    async def find_by_provider_id(self, provider: str, provider_user_id: str) -> Optional[dict]:
        connection = await self.collection.find_one({"provider": provider, "provider_user_id": provider_user_id})
        if connection:
            connection["_id"] = str(connection["_id"])
            if connection.get("user_id"):
                connection["user_id"] = str(connection["user_id"])
        return connection

    async def find_by_user_id(self, user_id: Union[str, ObjectId], provider: Optional[str] = None) -> Union[Optional[dict], list]:
        str_id = str(user_id)
        obj_id = ObjectId(str_id)
        
        query = {
            "$or": [
                {"user_id": obj_id},
                {"user_id": str_id}
            ]
        }
        if provider:
            query["provider"] = provider
            connection = await self.collection.find_one(query)
            if connection:
                connection["_id"] = str(connection["_id"])
                connection["user_id"] = str(connection["user_id"])
            return connection
        else:
            connections = await self.collection.find(query).to_list(length=None)
            for conn in connections:
                conn["_id"] = str(conn["_id"])
                conn["user_id"] = str(conn["user_id"])
            return connections

    async def delete_connection(self, connection_id: Union[str, ObjectId]) -> bool:
        if isinstance(connection_id, str):
            connection_id = ObjectId(connection_id)
        result = await self.collection.delete_one({"_id": connection_id})
        return result.deleted_count > 0

    async def delete_by_user_and_provider(self, user_id: Union[str, ObjectId], provider: str) -> bool:
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        result = await self.collection.delete_one({"user_id": user_id, "provider": provider})
        return result.deleted_count > 0

    async def find_all_by_user(self, user_id: Union[str, ObjectId]) -> list:
        str_id = str(user_id)
        obj_id = ObjectId(str_id)
        
        # Search for both ObjectId and string representation just in case
        connections = await self.collection.find({
            "$or": [
                {"user_id": obj_id},
                {"user_id": str_id}
            ]
        }).to_list(length=None)
        for conn in connections:
            conn["_id"] = str(conn["_id"])
            conn["user_id"] = str(conn["user_id"])
        return connections
