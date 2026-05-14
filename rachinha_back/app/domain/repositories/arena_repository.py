from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

class ArenaRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["arenas"]

    def serialize_arena(self, arena: dict) -> dict:
        """Converte campos ObjectId para string"""
        arena["_id"] = str(arena["_id"])
        arena["owner_id"] = str(arena["owner_id"])
        return arena

    async def create(self, arena_data: dict) -> str:
        result = await self.collection.insert_one(arena_data)

        return str(result.inserted_id)

    async def list_by_owner(self, owner_id: str) -> List[dict]:
        arenas = await self.collection.find({"owner_id": owner_id}).to_list(length=100)
        return [self.serialize_arena(arena) for arena in arenas]

    async def get_by_id(self, arena_id: str) -> Optional[dict]:
        arena = await self.collection.find_one({"_id": ObjectId(arena_id)})
        return self.serialize_arena(arena) if arena else None
    
    async def update_partial(self, arena_id: str, update_data: dict) -> bool:
        result = await self.collection.update_one(
            {"_id": ObjectId(arena_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete(self, arena_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(arena_id)})
        return result.deleted_count > 0
    
    async def get_arena_by_id(self, arena_id: str) -> Optional[dict]:
        arena = await self.collection.find_one({"_id": ObjectId(arena_id)})
        return self.serialize_arena(arena) if arena else None

    async def get_all_arenas(self) -> List[dict]:
        """Busca todas as arenas no banco de dados."""
        arenas = await self.collection.find({}).to_list(length=None)
        return [self.serialize_arena(arena) for arena in arenas]

    async def count_all_arenas(self) -> int:
        """Conta o número total de arenas."""
        return await self.collection.count_documents({})