from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional

class CourtRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["courts"]

    def serialize_court(self, court: dict) -> dict:
        """Converte campos ObjectId para string"""
        court["_id"] = str(court["_id"])
        court["owner_id"] = str(court["owner_id"])
        return court

    async def create(self, court_data: dict) -> str:
        result = await self.collection.insert_one(court_data)
        return str(result.inserted_id)

    async def list_by_owner(self, owner_id: str) -> List[dict]:
        courts = await self.collection.find({"owner_id": ObjectId(owner_id)}).to_list(length=100)
        return [self.serialize_court(court) for court in courts]

    async def get_by_id(self, court_id: str) -> Optional[dict]:
        court = await self.collection.find_one({"_id": ObjectId(court_id)})
        return self.serialize_court(court) if court else None
    
    async def delete(self, court_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(court_id)})
        return result.deleted_count > 0

    async def update_partial(self, court_id: str, data: dict):
        result = await self.collection.update_one(
            {"_id": ObjectId(court_id)},  # Procurar pela quadra pelo ID
            {"$set": data}  # Atualiza somente os campos presentes em 'data'
        )
        return result.modified_count > 0  # Retorna True se algum documento foi modificado

    async def get_all_courts(self) -> List[dict]:
        """Busca todas as quadras no banco de dados."""
        courts = await self.collection.find({}).to_list(length=None)
        return [self.serialize_court(court) for court in courts]

    async def count_all_courts(self) -> int:
        """Conta o número total de quadras."""
        return await self.collection.count_documents({})
    
    async def list_by_arena(self, arena_id: str) -> List[dict]:
        courts = await self.collection.find({"belong_arena": arena_id}).to_list(length=100)
        return [self.serialize_court(court) for court in courts]