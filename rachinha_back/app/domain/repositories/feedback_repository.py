import re
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Union
from bson import ObjectId
from pydantic import BaseModel

class FeedbackRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["feedback"]
    
    async def create_feedback(self, feedback_data: dict) -> str:
        """
        Cria um novo feedback e retorna o ID do feedback criado.
        """
        result = await self.collection.insert_one(feedback_data)
        return str(result.inserted_id)
    
    async def get_all_feedbacks(self) -> List[dict]:
        """Busca todos os feedbacks, ordenados pelo mais recente."""
        feedbacks = await self.collection.find({}).sort("created_at", -1).to_list(length=None)
        for fb in feedbacks:
            fb["_id"] = str(fb["_id"])
            if "user_id" in fb and isinstance(fb["user_id"], ObjectId):
                fb["user_id"] = str(fb["user_id"])
        return feedbacks

    async def count_all_feedbacks(self) -> int:
        """Conta todos os feedbacks."""
        return await self.collection.count_documents({})