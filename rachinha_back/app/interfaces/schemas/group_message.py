from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from bson import ObjectId 

class GroupMessageCreate(BaseModel):
    content: str
    group_id: str
    sender_id: str

class GroupMessageInDB(GroupMessageCreate):
    id: Optional[str] = Field(alias="_id")
    timestamp: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(), 
            ObjectId: str 
        }

class GroupIdsRequest(BaseModel):
    """Esquema para receber uma lista de IDs de turmas."""
    group_ids: List[str]