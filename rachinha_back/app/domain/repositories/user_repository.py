import re
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Union
from bson import ObjectId
from pydantic import BaseModel

class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["users"]

    async def create_user(self, user_data: dict) -> str:
        result = await self.collection.insert_one(user_data)
        return str(result.inserted_id)

    async def delete_user(self, user_id: Union[str, ObjectId]) -> bool:
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        result = await self.collection.delete_one({"_id": user_id})
        return result.deleted_count > 0

    async def find_by_email(self, email: str) -> Optional[dict]:
        return await self.collection.find_one({"email": email})

    async def find_by_username(self, username: str) -> Optional[dict]:
        return await self.collection.find_one({"username": username})

    async def find_by_id(self, user_id: Union[str, ObjectId]) -> Optional[dict]:
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        user = await self.collection.find_one({"_id": user_id})
        if user:
            user["_id"] = str(user["_id"]) # Garante que o _id seja string
        return user

    # Novo método para o BookingService
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """
        Retorna um usuário pelo seu ID, garantindo que o _id seja uma string.
        """
        return await self.find_by_id(user_id)

    async def update_user(self, user_id: Union[str, ObjectId], update_data: Union[dict, BaseModel]) -> bool:
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)

        if isinstance(update_data, BaseModel):
            # Converte o modelo Pydantic para dict, removendo valores None
            data = update_data.dict(exclude_unset=True)
        else:
            # Garante que não estamos modificando o dicionário original
            data = update_data.copy()

        # Se a atualização for um modelo Pydantic ou não tiver valores,
        # removemos os campos que são None para não sobrescrever dados existentes
        if isinstance(update_data, BaseModel) or update_data is not None:
            data = {k: v for k, v in data.items() if v is not None}

        if not data:
            return False

        # Decide se a atualização deve ser com '$set' ou se já é uma operação do MongoDB
        update_doc = data
        if not any(key.startswith('$') for key in data):
            update_doc = {"$set": data}

        result = await self.collection.update_one({"_id": user_id}, update_doc)
        return result.matched_count > 0
    
    async def search_users(
        self,
        query_text: str,
        limit: int = 5,
        user_ids: Optional[List[str]] = None,
        include_ghosts: bool = True
    ) -> List[dict]:
        """
        Busca usuários por nome ou username usando uma expressão regular case-insensitive.
        Retorna uma lista limitada de usuários com campos selecionados.
        """
        # Escapa caracteres especiais de regex para segurança
        safe_query = re.escape(query_text)

        and_filters = [
            {
                "$or": [
                    {"name": {"$regex": safe_query, "$options": "i"}},
                    {"username": {"$regex": safe_query, "$options": "i"}}
                ]
            }
        ]

        if not include_ghosts:
            and_filters.append({"is_placeholder": {"$ne": True}})

        if user_ids is not None:
            try:
                object_ids = [ObjectId(user_id) for user_id in user_ids]
            except Exception:
                return []
            and_filters.append({"_id": {"$in": object_ids}})

        query = {"$and": and_filters}
        # Projeção para retornar apenas os campos necessários (otimização)
        projection = {"_id": 1, "name": 1, "username": 1, "nickname": 1, "photo_url": 1}

        cursor = self.collection.find(query, projection).limit(limit)
        users = await cursor.to_list(length=limit)

        # Serializa o _id para string
        for user in users:
            user["_id"] = str(user["_id"])
            
        return users
    
    async def update_fcm_token(self, user_id: Union[str, ObjectId], fcm_token: str) -> bool:
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        result = await self.collection.update_one(
            {"_id": user_id},
            {"$set": {"fcm_token": fcm_token}}
        )
        # matched_count > 0 means user exists; modified_count can be 0 if token unchanged
        return result.matched_count > 0
    
    async def get_all_users(self) -> List[dict]:
        """Busca todos os usuários, retornando todos os campos exceto a senha."""
        projection = {"password": 0} 
        cursor = self.collection.find({}, projection)
        users = await cursor.to_list(length=None)
        for user in users:
            user["_id"] = str(user["_id"])
        return users

    async def count_all_users(self) -> int:
        """Conta o número total de usuários."""
        return await self.collection.count_documents({})